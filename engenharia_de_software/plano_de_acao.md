# Plano de Ação Técnico - EasyClin SaaS

Documento vivo de execução do projeto EasyClin. A cada etapa concluída, este arquivo deve ser atualizado com status, evidências de teste e observações técnicas.

## 1. Objetivo Final

Construir um SaaS de gestão clínica e odontológica premium, multi-tenant, responsivo e testável, combinando:

- Operação clínica: agenda, pacientes, prontuário, profissionais e permissões.
- Gestão odontológica/saúde: evolução clínica, alertas médicos, prescrição, bloqueio LGPD e auditoria.
- Gestão comercial: orçamentos, aprovação, conversão financeira e status de propostas.
- Precificação QiDent: cálculo de preço por custo real, custo de sala, repasse profissional e margem desejada.
- Gestão financeira: receitas, despesas, fluxo de caixa e relatórios.
- Plataforma SaaS: tenants, planos, trial, inadimplência, suspensão e painel super admin.
- Arquitetura limpa: domínio desacoplado de React, persistência plugável e caminho claro para Supabase.

## 2. Fontes Analisadas

### 2.1 Engenharia de Software

- `engenharia_de_software/design_system/kinetic_medical/DESIGN.md`
- Referências visuais HTML/PNG em `engenharia_de_software/design_system/*`
- `engenharia_de_software/levantamento_requisitos_plataforma_odontologica_qident_simples_dental (1).pdf`
- Plano anterior em `engenharia_de_software/plano_de_acao.md`

Observação sobre o PDF: o arquivo existe e foi inspecionado, mas o ambiente local não possui `pdftotext`, `qpdf`, `pdfinfo`, `mutool`, `gs`, `pypdf` ou `PyPDF2`. A tentativa com `textutil` retornou apenas conteúdo PDF bruto/streams comprimidos, sem texto extraível útil. Portanto, os requisitos foram consolidados a partir do nome do levantamento, do plano existente, do código atual e das telas do design system. Quando houver uma versão `.md`, `.docx` ou texto exportado do levantamento, esta seção deve ser revisada.

### 2.2 Código Fonte

- Aplicação Vite + React 19 + TypeScript + Tailwind CSS 4.
- Entrada: `src/main.tsx`, `src/App.tsx`.
- Tipos centrais: `src/types.ts`.
- Persistência/mock: `src/services/db.ts`.
- Views: `src/views/Auth.tsx`, `src/views/ClinicDashboard.tsx`, `src/views/SuperAdmin.tsx`.
- Painéis: `DashboardPanel`, `AgendaPanel`, `PatientPanel`, `BudgetPanel`, `QiDentCalculator`, `FinancePanel`.
- UI base: `src/components/ui/*`.

## 3. Estado Atual do Projeto

### 3.1 Já Funciona

- Login simulado e criação inicial de clínica em trial.
- Alternância de papel dentro da clínica.
- Dashboard principal com KPIs clínicos e financeiros.
- Agenda semanal com criação de consultas, status e simulação de CRM.
- Cadastro de pacientes, alertas médicos e prontuário com bloqueio visual LGPD.
- Orçamentos com itens de procedimento, desconto, margem e conversão para receita ao aprovar.
- Calculadora QiDent funcional no componente.
- Financeiro com lançamentos manuais e resumo de caixa.
- Painel super admin com tenants, planos, MRR estimado, status e auditoria.
- Design system parcialmente aplicado.
- `npm run lint` executado com sucesso em 2026-06-17.

### 3.2 Principais Riscos Técnicos

- Regras de negócio estão dentro dos componentes React.
- `dbObj` é acessado diretamente por views e painéis, dificultando teste e troca de infraestrutura.
- Tipos de domínio, DTOs, persistência e dados mockados estão concentrados.
- Cálculo QiDent existe em mais de um ponto e não possui testes unitários.
- Auditoria e LGPD são visuais/simuladas, sem garantias reais de integridade.
- Permissões estão parcialmente no menu, mas não protegidas como política central.
- Multi-tenant depende de filtros manuais em métodos e chamadas.
- Datas e métricas usam dados fixos/simulados em alguns pontos.
- UI base existe, mas nem todos os módulos usam os mesmos componentes/tokens.
- Não há ambiente de testes automatizados além do TypeScript.

## 4. Princípios de Execução

- Cada etapa deve terminar com `npm run lint` verde.
- Regras puras devem nascer testáveis antes de integrar UI.
- Componentes React devem ficar focados em renderização e intenção do usuário.
- Persistência deve ser acessada por portas/repositórios, não por `dbObj` direto.
- Nenhuma etapa deve misturar refatoração ampla com redesenho visual sem necessidade.
- Toda regra crítica de dinheiro, agenda, tenant, permissão e prontuário deve ter teste.
- Design deve seguir Kinetic Medical: Inter, grid responsivo, raio consistente, tabelas sem bordas verticais, badges low-contrast e foco visível.

## 5. Roadmap Executivo

Status:

- `[x]` concluído
- `[~]` em andamento
- `[ ]` pendente

### Etapa 0 - Diagnóstico e Planejamento

Status: `[x]`

Objetivo: entender projeto, requisitos, arquitetura atual e transformar o plano em backlog executável.

Entregáveis:

- `[x]` Inventário de arquivos e módulos.
- `[x]` Leitura do design system e plano anterior.
- `[x]` Inspeção dos componentes principais e persistência.
- `[x]` Validação TypeScript com `npm run lint`.
- `[x]` Plano técnico documentado neste arquivo.

Critério de aceite:

- Plano versionado com etapas, dependências, critérios e testes.

Evidência:

- `npm run lint` passou em 2026-06-17.

### Etapa 1 - Finalizar Alinhamento Visual por Módulo

Status: `[~]`

Objetivo: fechar a camada visual antes da arquitetura profunda, reduzindo retrabalho de UI.

Tarefas:

- `[x]` Refatorar `PatientPanel.tsx` conforme `prontu_rio_easyclin` e `cadastro_de_pacientes_easyclin`.
- `[ ]` Refatorar `BudgetPanel.tsx` e `QiDentCalculator.tsx` conforme orçamento/precificação.
- `[ ]` Refatorar `FinancePanel.tsx` conforme financeiro.
- `[ ]` Refatorar `SuperAdmin.tsx` conforme dashboard admin e assinatura/planos.
- `[ ]` Revisar `DashboardPanel.tsx` e `AgendaPanel.tsx` para consistência final de tokens, responsividade e densidade.
- `[ ]` Remover uso visual inconsistente de cores soltas quando houver token equivalente.
- `[ ]` Garantir que botões, inputs, cards e modais usem componentes base sempre que fizer sentido.

Critérios de aceite:

- Todas as telas principais seguem o design system.
- Layout responsivo sem sobreposição em mobile, tablet e desktop.
- Tabelas com leitura clara e hover sutil.
- Status críticos com badges consistentes.
- `npm run lint` verde.

Testes/validação:

- `npm run lint`.
- Teste manual dos fluxos principais em navegador: login, dashboard, agenda, pacientes, orçamento, precificação, financeiro e super admin.

### Etapa 2 - Fundações de Domínio e Regras Puras

Status: `[ ]`

Objetivo: extrair regras de negócio críticas para código puro e testável, sem mudar comportamento visual.

Estrutura proposta:

```txt
src/domain/
  entities/
  value-objects/
  services/
  policies/
  repositories/
src/application/
  usecases/
src/infrastructure/
  local-storage/
src/presentation/
  viewmodels/
```

Tarefas:

- `[ ]` Mover tipos centrais de negócio para `src/domain/entities` ou criar aliases progressivos.
- `[ ]` Criar `PricingService` para a fórmula QiDent.
- `[ ]` Criar `BudgetTotalsService` para totais, comissão, desconto, lucro e margem.
- `[ ]` Criar `SubscriptionPolicy` para trial, active, pending, overdue, suspended e cancelled.
- `[ ]` Criar `MedicalRecordPolicy` para bloqueio, retificação futura e leitura sensível.
- `[ ]` Criar `PermissionPolicy` para clinic admin, professional, receptionist, patient e super admin.
- `[ ]` Criar testes unitários para todas as regras puras.

Critérios de aceite:

- Nenhuma regra financeira crítica fica duplicada em componente.
- Fórmulas são determinísticas e cobertas por testes.
- Componentes continuam funcionando com o mesmo comportamento.

Testes/validação:

- Instalar/configurar Vitest.
- Testes de preço QiDent, margem, orçamento, status de tenant e permissões.
- `npm run lint`.

### Etapa 3 - Portas de Repositório e Adaptador LocalStorage

Status: `[ ]`

Objetivo: isolar persistência e preparar troca para Supabase sem reescrever UI.

Tarefas:

- `[ ]` Criar contratos em `src/domain/repositories`.
- `[ ]` Criar repositórios para tenants, users, patients, appointments, procedures, budgets, transactions, records e audit logs.
- `[ ]` Implementar `LocalStorage*Repository` usando a lógica atual de `db.ts`.
- `[ ]` Criar `RepositoryFactory` ou composição única da infraestrutura.
- `[ ]` Manter `dbObj` temporariamente como fachada de compatibilidade, se necessário.
- `[ ]` Garantir filtro obrigatório por `tenantId` em todos os repositórios tenant-scoped.

Critérios de aceite:

- Componentes não precisam conhecer `localStorage`.
- Acesso cross-tenant é prevenido no adaptador.
- Dados seedados continuam funcionando.

Testes/validação:

- Testes unitários de repositório local com storage fake.
- Teste de segregação por tenant.
- `npm run lint`.

### Etapa 4 - Casos de Uso da Aplicação

Status: `[ ]`

Objetivo: concentrar fluxos com múltiplas regras em use cases testáveis.

Tarefas:

- `[ ]` `LoginUserUseCase`.
- `[ ]` `RegisterClinicTrialUseCase`.
- `[ ]` `CreatePatientUseCase`.
- `[ ]` `CreateAppointmentUseCase`.
- `[ ]` `ChangeAppointmentStatusUseCase`.
- `[ ]` `CreateMedicalRecordUseCase`.
- `[ ]` `LockMedicalRecordUseCase`.
- `[ ]` `CreateBudgetUseCase`.
- `[ ]` `ApproveBudgetUseCase`.
- `[ ]` `SaveProcedurePricingUseCase`.
- `[ ]` `CreateFinancialTransactionUseCase`.
- `[ ]` `UpdateTenantSubscriptionUseCase`.
- `[ ]` `RegisterAuditLogUseCase`.

Critérios de aceite:

- Fluxos críticos não chamam repositório diretamente da UI.
- Auditoria é disparada pelos use cases, não espalhada em componentes.
- Use cases possuem testes de sucesso e falha.

Testes/validação:

- Testes unitários com repositórios em memória.
- Teste de aprovação de orçamento gerando receita.
- Teste de bloqueio de prontuário impedindo alteração direta.

### Etapa 5 - ViewModels e UI Desacoplada

Status: `[ ]`

Objetivo: aplicar MVVM progressivamente nos módulos, mantendo a UI componentizada.

Tarefas:

- `[ ]` Criar ViewModels/hooks por módulo: auth, dashboard, agenda, pacientes, orçamentos, precificação, financeiro, super admin.
- `[ ]` Migrar estado e handlers dos componentes para ViewModels.
- `[ ]` Componentes passam a receber estado, comandos e callbacks.
- `[ ]` Centralizar loading, erro, empty state e mensagens de sucesso.
- `[ ]` Padronizar form state e validações.

Ordem recomendada:

1. Precificação e orçamento, por terem regra financeira crítica.
2. Pacientes e prontuário, por LGPD/auditoria.
3. Agenda, por status e CRM.
4. Financeiro.
5. Auth e super admin.
6. Dashboard.

Critérios de aceite:

- Componentes ficam majoritariamente declarativos.
- ViewModels são testáveis sem DOM.
- Fluxos manuais continuam equivalentes.

Testes/validação:

- Testes de ViewModel.
- `npm run lint`.
- Teste manual por tela migrada.

### Etapa 6 - Segurança, LGPD e Auditoria Realista

Status: `[ ]`

Objetivo: transformar controles simulados em políticas consistentes.

Tarefas:

- `[ ]` Criar modelo de auditoria para leitura, criação, atualização, bloqueio e exclusão lógica.
- `[ ]` Registrar leitura de dados sensíveis: prontuário, CPF/documento, financeiro.
- `[ ]` Adicionar hash de integridade no prontuário bloqueado.
- `[ ]` Impedir edição de registro bloqueado no domínio/repositório.
- `[ ]` Criar termo aditivo/retificação em vez de editar prontuário bloqueado.
- `[ ]` Sanitizar inputs textuais antes de persistir ou renderizar conteúdo livre.
- `[ ]` Padronizar mensagens de erro sem vazar detalhes internos.
- `[ ]` Aplicar política de permissão em use cases, não só no menu.

Critérios de aceite:

- Usuário sem permissão não executa ação por chamada direta.
- Registro bloqueado não é alterável.
- Eventos sensíveis aparecem no audit log.
- Testes cobrem permissão, bloqueio e tenant.

Testes/validação:

- Testes unitários de políticas.
- Testes de use case com papel não autorizado.
- Teste de tentativa de alteração de prontuário bloqueado.

### Etapa 7 - SaaS Multi-Tenant, Planos e Cobrança

Status: `[ ]`

Objetivo: consolidar comportamento comercial da plataforma.

Tarefas:

- `[ ]` Criar tela/aba de assinatura para clínica.
- `[ ]` Implementar status calculado por vencimento: trial, active, pending, overdue, suspended.
- `[ ]` Criar bloqueios por status de assinatura com regra central.
- `[ ]` Criar `PaymentProviderPort`.
- `[ ]` Criar `MockPaymentProvider`.
- `[ ]` Simular Pix/cartão e regularização.
- `[ ]` Melhorar super admin para plano, fatura, MRR, churn e inadimplência.

Critérios de aceite:

- Tenant suspenso não acessa módulos operacionais.
- Regularização simulada reativa o tenant com auditoria.
- Regras comerciais são testadas por data absoluta/fake clock.

Testes/validação:

- Testes de status por vencimento.
- Testes de pagamento mock.
- Teste manual de tenant ativo, trial e suspenso.

### Etapa 8 - Performance, Paginação e Eventos Internos

Status: `[ ]`

Objetivo: preparar crescimento de dados sem travar UI ou acoplar automações.

Tarefas:

- `[ ]` Adicionar paginação/filtros em repositórios.
- `[ ]` Refatorar listas de pacientes, financeiro, auditoria e orçamentos para paginação.
- `[ ]` Criar event bus interno simples.
- `[ ]` Emitir eventos como `AppointmentCreated`, `BudgetApproved`, `MedicalRecordLocked`, `TenantSuspended`.
- `[ ]` Simular CRM/WhatsApp como subscriber de evento, não lógica direta do componente.
- `[ ]` Usar `useMemo`/`useCallback` onde houver listas grandes e cálculos derivados.

Critérios de aceite:

- UI suporta base grande simulada.
- Automações não ficam presas ao componente.
- Filtros e paginação preservam tenant.

Testes/validação:

- Testes do event bus.
- Teste de paginação por repositório.
- Teste manual com seed ampliado.

### Etapa 9 - Supabase e Infraestrutura Plugável

Status: `[ ]`

Objetivo: permitir troca controlada de localStorage para banco real.

Tarefas:

- `[ ]` Criar `src/infrastructure/supabase`.
- `[ ]` Criar schema SQL inicial.
- `[ ]` Definir tabelas, índices, FKs e RLS.
- `[ ]` Implementar repositórios Supabase para entidades principais.
- `[ ]` Criar variável de ambiente para modo de infraestrutura.
- `[ ]` Criar factory de repositórios por modo.
- `[ ]` Documentar migração e seeds.

Critérios de aceite:

- Aplicação seleciona infraestrutura por configuração.
- RLS garante segregação por tenant no banco.
- Repositórios Supabase passam nos mesmos contratos de teste.

Testes/validação:

- Testes de contrato compartilhados entre local e Supabase mockado.
- Validação manual contra projeto Supabase quando credenciais existirem.

### Etapa 10 - Qualidade, Acessibilidade e Prontidão de Produto

Status: `[ ]`

Objetivo: estabilizar para uso real/demo avançada.

Tarefas:

- `[ ]` Adicionar Playwright para smoke tests dos fluxos principais.
- `[ ]` Validar acessibilidade básica: labels, foco, aria em modais e botões icônicos.
- `[ ]` Remover dependência de dados mágicos nos componentes.
- `[ ]` Criar estados de loading/error/empty padronizados.
- `[ ]` Revisar responsividade em 375px, 768px, 1280px e 1440px.
- `[ ]` Criar documentação técnica de arquitetura.
- `[ ]` Criar roteiro de demo funcional.

Critérios de aceite:

- Smoke tests cobrem login, agenda, paciente, orçamento, financeiro e super admin.
- Build e lint verdes.
- UX sem sobreposição ou quebras visuais nos breakpoints-alvo.

Testes/validação:

- `npm run lint`.
- `npm run build`.
- Playwright smoke.
- QA visual manual.

## 6. Backlog de Módulos por Prioridade

### Prioridade Alta

- Precificação QiDent como domínio puro.
- Orçamentos e conversão financeira.
- Pacientes/prontuário/LGPD.
- Multi-tenant e permissões.
- Testes unitários.

### Prioridade Média

- Agenda com eventos internos e CRM simulado.
- Financeiro com filtros e paginação.
- Super admin e cobrança SaaS.
- ViewModels completos.

### Prioridade Baixa Inicial

- Supabase real antes das regras estarem isoladas.
- Relatórios avançados.
- Integrações reais de pagamento/WhatsApp.
- Dark mode completo, caso não seja objetivo imediato.

## 7. Ordem Recomendada de Trabalho a Partir de Agora

1. Concluir Etapa 1, começando por `PatientPanel.tsx`, porque ainda está marcada como pendente no plano anterior e envolve prontuário/LGPD.
2. Criar Vitest e extrair serviços de domínio da Etapa 2, começando por QiDent e orçamentos.
3. Migrar orçamento/precificação para use cases e ViewModels.
4. Migrar pacientes/prontuário para use cases e ViewModels.
5. Introduzir repositórios e remover chamadas diretas ao `dbObj`.
6. Consolidar segurança, tenant e auditoria.
7. Evoluir cobrança SaaS e super admin.
8. Preparar Supabase.

## 8. Registro de Progresso

| Data | Etapa | Status | Evidência |
|---|---:|---|---|
| 2026-06-17 | 0 | Concluída | Análise do projeto, design system, plano anterior, código fonte e `npm run lint` verde. |
| 2026-06-17 | 1.1 | Concluída | `PatientPanel.tsx` alinhado ao design system com listagem, métricas, resumo do paciente, abas e timeline clínica. `npm run lint` e `npm run build` verdes. |

## 9. Próxima Etapa Ativa

Próxima etapa sugerida: **Etapa 1.2 - Refatorar `BudgetPanel.tsx` e `QiDentCalculator.tsx` conforme orçamento/precificação do design system**.

Critério para iniciar:

- Alterar somente UI/estrutura de orçamento e precificação, sem introduzir ainda repositórios ou use cases.
- Manter comportamento atual funcionando.
- Rodar `npm run lint` ao final.
