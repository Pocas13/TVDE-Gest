# Atualizar o TVDE Gest para a versão 0.5.0

## 1. Fazer cópia da pasta atual

Fecha o servidor local e copia a pasta `D:\TVDE Gest` para uma pasta de segurança.

## 2. Substituir os ficheiros

Extrai o ZIP em `D:\` e aceita substituir os ficheiros dentro de `D:\TVDE Gest`.

O ficheiro `.dev.vars` não está incluído no ZIP e deve manter as tuas credenciais locais.

## 3. Instalar e validar

```powershell
Set-Location "D:\TVDE Gest"
npm install
npm run check
```

## 4. Criar a base de dados D1

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\configurar-d1.ps1"
```

O script cria a base, acrescenta o binding `DB` ao `wrangler.jsonc` e aplica as migrações.

## 5. Credenciais

Mantém as credenciais Bolt em `.dev.vars`. Quando a Uber aprovar a aplicação, acrescenta:

```env
UBER_CLIENT_ID=...
UBER_CLIENT_SECRET=...
```

Para produção, usa `npx wrangler secret put ...`; nunca envies estes valores para o GitHub.

## 6. Testar

```powershell
npm run dev
```

No painel: Integrações → Testar integrações → Sincronizar Bolt/Uber.

## 7. GitHub

```powershell
git add .
git commit -m "Adiciona Uber, D1 e acertos semanais"
git push
```
