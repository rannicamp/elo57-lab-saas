"use client";

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext'; // Importamos o Auth existente
import { createClient } from '../utils/supabase/client'; // Ajuste o caminho se necessário (ex: '@/utils/...')

const OrganizationContext = createContext();

export function OrganizationProvider({ children }) {
    const { user, loading: authLoading } = useAuth(); 
    const supabase = createClient();

    const [currentOrg, setCurrentOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);

    useEffect(() => {
        const loadOrganizationData = async () => {
            if (authLoading) return;

            if (!user || !user.organizacao_id) {
                setCurrentOrg(null);
                setIsSystemAdmin(false);
                setLoading(false);
                return;
            }

            // 1. Busca os detalhes da organização atual
            const { data: orgData, error } = await supabase
                .from('organizacoes')
                .select('*')
                .eq('id', user.organizacao_id)
                .single();

            if (error) {
                console.error("Erro ao carregar organização:", error);
                setCurrentOrg({ id: user.organizacao_id, nome: 'Minha Organização' });
            } else {
                setCurrentOrg(orgData);
            }

            // 2. Define se é a "Matriz" (Sistema Global)
            setIsSystemAdmin(user.organizacao_id === 1);

            setLoading(false);
        };

        loadOrganizationData();
    }, [user, authLoading, supabase]);

    const getScopeQuery = (queryBuilder) => {
        if (!currentOrg) return queryBuilder;
        return queryBuilder.or(`organizacao_id.eq.${currentOrg.id},organizacao_id.eq.1`);
    };

    const value = useMemo(() => ({
        org: currentOrg,
        orgId: currentOrg?.id,
        isSystemAdmin,
        loading,
        getScopeQuery
    }), [currentOrg, isSystemAdmin, loading]);

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization deve ser usado dentro de um OrganizationProvider');
    }
    return context;
}