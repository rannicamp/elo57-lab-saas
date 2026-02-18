'use client'

import { useState } from 'react'
import { Shield, FileText, CheckCircle } from 'lucide-react'

export default function PoliticasDeUsoPage() {
  const [activeTab, setActiveTab] = useState('privacy')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Políticas e Termos de Uso</h1>
        <p className="text-slate-500">Documentação legal e diretrizes de privacidade do sistema.</p>
      </div>

      {/* Navegação em Abas */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'privacy' 
              ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Política de Privacidade (LGPD)
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'terms' 
              ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Termos de Uso
        </button>
      </div>

      {/* Conteúdo do Documento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <article className="prose prose-slate max-w-none text-slate-600">
          
          {activeTab === 'privacy' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Política de Privacidade e Proteção de Dados</h2>
              
              <div className="space-y-6 text-sm leading-relaxed">
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">1. Introdução</h3>
                  <p>A <strong>[NOME DA SUA EMPRESA]</strong> compromete-se com a privacidade e a proteção dos dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD). Esta política descreve como coletamos, usamos e protegemos suas informações.</p>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">2. Dados Coletados</h3>
                  <p>Para o funcionamento do sistema de Gestão de Obras e CRM, coletamos:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Dados de Cadastro:</strong> Nome, CPF/CNPJ, e-mail, telefone e endereço do contratante.</li>
                    <li><strong>Dados Inseridos pelo Usuário:</strong> Informações sobre obras, projetos, custos, cronogramas e dados de terceiros (clientes finais) inseridos no módulo CRM.</li>
                    <li><strong>Logs de Acesso:</strong> Endereço IP, data, hora e ações realizadas no sistema.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">3. Finalidade do Tratamento</h3>
                  <p>O tratamento dos dados tem como base legal a Execução de Contrato e o Legítimo Interesse para:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Disponibilizar as funcionalidades de gestão e CRM.</li>
                    <li>Gerar relatórios, cronogramas e orçamentos.</li>
                    <li>Realizar cobranças e suporte técnico.</li>
                    <li>Garantir a segurança da plataforma.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">4. Compartilhamento de Dados</h3>
                  <p>O compartilhamento ocorre apenas com fornecedores de infraestrutura tecnológica (servidores em nuvem) que garantem segurança de nível internacional e autoridades judiciais quando exigido por lei.</p>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">5. Seus Direitos</h3>
                  <p>Você tem direito a confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos, solicitar anonimização ou revogar o consentimento, conforme Art. 18 da LGPD.</p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Termos e Condições de Uso</h2>
              
              <div className="space-y-6 text-sm leading-relaxed">
                <section>
                  <h3 className="font-bold text-slate-900 mb-2">1. Aceite dos Termos</h3>
                  <p>Ao criar uma conta e utilizar o sistema, você concorda integralmente com estes termos. O sistema é licenciado, não vendido, para seu uso exclusivo como ferramenta de gestão.</p>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">2. Responsabilidades do Usuário</h3>
                  <p>O Usuário declara que é responsável pela veracidade e legalidade de todos os dados inseridos (projetos, custos, dados de clientes) e possui autorização para inserir dados de terceiros no módulo CRM.</p>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">3. Acesso e Processamento de Dados</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="font-medium text-slate-800 mb-2">Cláusula de Autorização:</p>
                    <p>O Usuário concorda e autoriza expressamente que a plataforma tenha acesso automatizado, processe e categorize todas as informações, arquivos e dados publicados para fins de geração de relatórios, dashboards e funcionamento das ferramentas de inteligência do sistema.</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">4. Propriedade Intelectual</h3>
                  <p>O código-fonte, layout e metodologia pertencem à Licenciante. Os dados das obras e clientes inseridos pertencem ao Usuário. A plataforma atua apenas como facilitadora.</p>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900 mb-2">5. Limitação de Responsabilidade</h3>
                  <p>Não nos responsabilizamos por erros de engenharia, cálculos estruturais ou prejuízos em obras decorrentes de dados inseridos incorretamente pelo Usuário, nem por falhas na conexão de internet do mesmo.</p>
                </section>
              </div>
            </div>
          )}

        </article>
      </div>

      {/* Rodapé Fixo */}
      <div className="text-center text-xs text-slate-400 py-4">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  )
}