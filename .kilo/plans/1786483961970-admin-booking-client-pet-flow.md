# Plano: Fluxo de Agendamento Admin — Cliente → Pet

## Problema
No modal "Novo Agendamento" da área admin (`app/admin/agenda/page.tsx`), o primeiro campo é **Pet** (lista todos os pets do banco). Isso permite selecionar um pet que não pertence ao cliente desejado. O cliente é apenas derivado implicitamente do pet, sem validação.

## Solução
Inverter a ordem para **Cliente → Pet** e adicionar validação no backend para impedir bypass por chamada direta à API.

---

## Tarefas

### 1. Frontend — Adicionar seleção de Cliente/Tutor
**Arquivo:** `app/admin/agenda/page.tsx`

- Adicionar estado: `const [formClientId, setFormClientId] = useState("");`
- Adicionar dropdown de **Cliente/Tutor** logo no início do formulário do modal (linha ~1202), antes do campo de Pet.
  - Opção padrão: `-- Selecione o Cliente --`
  - Listar `tutorsList` (já carregada pelo `GET /api/admin/agenda`)
  - Exibir `full_name` e `phone` de cada tutor
- Quando `formClientId` mudar:
  - Resetar `formPetId` para `""`
  - O campo de Pet passará a mostrar apenas pets cujo `client_id === formClientId`
- Quando `formPetId` mudar, garantir que ele pertence ao cliente selecionado (o filtro do dropdown já garante isso no frontend).
- No `handleSaveAppointment` (linha ~318), incluir `client_id: formClientId` no payload do `POST`.

### 2. Frontend — Filtrar pets por cliente
**Arquivo:** `app/admin/agenda/page.tsx`

- Substituir o `petsList` bruto no `<select>` de pets por uma lista filtrada:
  ```ts
  const filteredPets = useMemo(
    () => petsList.filter((p) => !formClientId || p.client_id === formClientId),
    [petsList, formClientId]
  );
  ```
- O `<select>` de pets renderiza `filteredPets` em vez de `petsList`.
- Se `formClientId` estiver vazio, o dropdown de pets pode ficar desabilitado ou mostrar todos (mas o recomendado é bloquear a seleção até o cliente ser escolhido).

### 3. Frontend — Atualizar validação do submit
**Arquivo:** `app/admin/agenda/page.tsx`

- No início de `handleSaveAppointment`, adicionar:
  ```ts
  if (!formClientId) {
    alert("Por favor, selecione um cliente.");
    return;
  }
  ```
- O payload do `POST` deve incluir `client_id: formClientId`.

### 4. Backend — Validar pertencimento no POST
**Arquivo:** `app/api/admin/agenda/route.ts`

- No `POST` (linha ~173), extrair `client_id` do body:
  ```ts
  const { pet_id, service_id, service_type, service_date, notes, address, professional, price, force, use_package_id, recurring_interval_days, client_id } = body;
  ```
- Após validação de campos obrigatórios, adicionar:
  ```ts
  if (client_id) {
    const { data: pet } = await adminSupabase
      .from("pets")
      .select("client_id")
      .eq("id", pet_id)
      .maybeSingle();

    if (!pet || pet.client_id !== client_id) {
      return NextResponse.json(
        { error: "O pet selecionado não pertence ao cliente informado." },
        { status: 400 }
      );
    }
  }
  ```
- Se `client_id` não for enviado, manter comportamento atual (não quebrar chamadas existentes).

### 5. Estado do modal — Reset ao fechar
**Arquivo:** `app/admin/agenda/page.tsx`

- No fechamento do modal (`setIsModalOpen(false)`), resetar `formClientId` para `""` além dos demais campos.

---

## Validação

- **Caminho feliz:** Admin seleciona Cliente → vê apenas pets daquele cliente → seleciona pet → salva agendamento. Backend valida pertencimento.
- **Bypass por API direta:** Se alguém enviar `client_id` + `pet_id` de outro cliente, backend retorna 400.
- **Compatibilidade:** Chamadas `POST` sem `client_id` continuam funcionando (comportamento legado).

## Arquivos afetados

- `app/admin/agenda/page.tsx` (frontend do modal)
- `app/api/admin/agenda/route.ts` (validação no POST)

## Riscos

- Baixo: mudança cirúrgica em um modal específico e em um endpoint já existente.
- A lista `tutorsList` já é carregada pelo `GET /api/admin/agenda`, então não há nova query necessária.
