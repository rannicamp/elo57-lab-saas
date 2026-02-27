// app/api/ai/agent-tasks/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key não configurada" }), { status: 500 });
    }

    const body = await req.json();
    const { messages, contextData, today, currentPlan } = body;

    const genAI = new GoogleGenerativeAI(apiKey);

    // SCHEMA: Permite que a IA converse CASO não preencha as activities
    const schema = {
      description: "Plano estruturado do assistente",
      type: "object",
      properties: {
        thought_process: { type: "string", description: "Avalie se você já tem dados suficientes (o que e quando) para criar o plano ou se precisa conversar com o usuário." },
        message: { type: "string", description: "Uma mensagem conversacional para o usuário (Ex: 'Entendi, para que dia é essa obra?', 'Legal, criei as 3 tarefas!')." },
        activities: {
          type: "array",
          description: "Deixe vazio se estiver apenas tirando dúvidas. Preencha apenas quando tiver certeza das tarefas e eventos.",
          items: {
            type: "object",
            properties: {
              temp_id: { type: "integer" },
              id: { type: "integer", description: "ID real do banco de dados (se já existir)." },
              action: { type: "string", description: "Ação a ser feita com a tarefa: CREATE, UPDATE, DELETE ou KEEP." },

              // TIPO: A decisão mais importante
              tipo_atividade: { type: "string", description: "Tipo da Atividade: Evento ou Tarefa" },

              nome: { type: "string" },
              descricao: { type: "string" },
              status: { type: "string", description: "Deve ser 'Não Iniciado'", default: "Não Iniciado" },

              // DATA (Comum a ambos)
              data_inicio_prevista: { type: "string", description: "YYYY-MM-DD" },

              // CAMPOS EXCLUSIVOS DE EVENTO (Hora Marcada)
              hora_inicio: { type: "string", description: "HH:MM:SS - OBRIGATÓRIO PARA EVENTOS. Null para Tarefas." },
              duracao_horas: { type: "number", description: "Duração em horas (ex: 1, 2.5). OBRIGATÓRIO PARA EVENTOS." },

              // CAMPOS EXCLUSIVOS DE TAREFA (Dias de Obra)
              duracao_dias: { type: "number", description: "Duração em dias (ex: 1, 3, 0.5). OBRIGATÓRIO PARA TAREFAS. Para Eventos envie 0." },

              // Vínculos
              empreendimento_id: { type: "integer", nullable: true },
              funcionario_id: { type: "string", nullable: true },
              responsavel_texto: { type: "string", nullable: true },
              parent_temp_id: { type: "integer", nullable: true }
            },
            required: ["nome", "tipo_atividade", "data_inicio_prevista"]
          }
        }
      },
      required: ["message"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      systemInstruction: `
        VOCÊ É UM ASSISTENTE DE GESTÃO DO STUDIO 57.
        Data de hoje: ${today}
        Você está conversando com: ${contextData.nome_usuario}
        
        Sua personalidade: Seja extremamente cortês, educado, e sempre se dirija ao usuário pelo nome dele de forma amigável.
        
        SUA NOVA REGRA DE OURO É "FLEXIBILIDADE":
        O usuário possui uma tela com o Chat na esquerda e os Cartões de Atividade na direita.
        NUNCA SUGIRA TAREFAS EM FORMATO DE TEXTO DENTRO DA MENSAGEM DO CHAT.
        
        1. SE O USUÁRIO FOR VAGO OU SE VOCÊ PRECISA DE INFORMAÇÕES VITAIS:
           Você PODE e DEVE fazer perguntas para ele. (Ex: "Quantos dias dura esse projeto?", "Qual o horário da reunião amanhã?").
           Neste caso, envie sua pergunta no campo 'message' e retorne o array 'activities' VAZIO ([]).

        2. SE O USUÁRIO DEU CONTEXTO SUFICIENTE (ex: "Criar 3 tarefas de projeto", "Reunião amanhã às 16"):
           Envie imediatamente o rascunho no array 'activities'.
           Use a 'message' para explicar o que acabou de aparecer na direita (Ex: "Criei o rascunho das 3 atividades aqui ao lado!").
           Você tem permissão para usar textos genéricos (como data de hoje) se faltarem apenas pequenos detalhes secundários.

        --- GERENCIAMENTO DE ESTADO (CUD) ---
        Se o usuário te enviou um "Plano Atual" (via JSON na mensagem) e pediu alterações:
        1. Para tarefas que continuam iguais, devolva elas com as mesmas informações e action: "KEEP" ou "UPDATE".
        2. Para tarefas que tiveram a data ou qualquer detalhe alterado, MANTENHA O MESMO 'id' e use action: "UPDATE".
        3. Para tarefas que o usuário mandou cancelar ou remover, MANTENHA O MESMO 'id' e use action: "DELETE".
        4. Para novas tarefas adicionadas na lista, envie sem 'id' e use action: "CREATE".

        REGRAS DO ARRAY ACTIVITIES QUANDO FOR PREENCHÊ-LO:
        --- MODO 1: EVENTO (Compromisso na Agenda) ---
        - Se for evento (Reunião, Visita, tem hora marcada):
          'tipo_atividade': "Evento", 'hora_inicio': HH:MM, 'duracao_dias': 0, 'duracao_horas': (1 a X).

        --- MODO 2: TAREFA (Serviço de Obra/Escritório) ---
        - Se for tarefa solta para o dia (Comprar, Pintar):
          'tipo_atividade': "Tarefa", 'hora_inicio': null, 'duracao_dias': (maior que 0), 'duracao_horas': null.

        --- CONTEXTO DO BANCO E AGENDA (IMPORTANTE) ---
        Agenda Atual de ${contextData.nome_usuario} (Próximos 30 dias): ${JSON.stringify(contextData.agenda_atual || [])}
        *Se o usuário pedir uma tarefa ou evento, cruze os dados com essa agenda acima. NÃO marque eventos no mesmo dia/hora de algo que já existe na agenda dele, a menos que ele insista. Se houver conflito, diga no chat: "Vi que você já tem X nesse horário, que tal marcarmos para as Yh?"*
        
        Obras Disponíveis: ${JSON.stringify(contextData.empreendimentos || [])}
        Funcionários Gerais: ${JSON.stringify(contextData.funcionarios || [])}

        --- RESPONSÁVEL ---
        - Se não citado nome, use 'funcionario_id': "SELF". Se citado, busque o ID.
      `
    });

    // Converter mensagens para o formato do Google
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastUserMessage = messages[messages.length - 1].content;
    let finalPrompt = lastUserMessage;

    if (currentPlan && currentPlan.length > 0) {
      finalPrompt = `O usuário disse: "${lastUserMessage}". Seu objetivo agora é Modificar/Manter o plano DE ACORDO com a vontade dele, ou apenas responder a pergunta que ele fez sem deletar as tarefas. Plano Atual no painel direito: ${JSON.stringify(currentPlan)}`;
    }

    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(finalPrompt);
    return new Response(result.response.text(), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no Agente:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}