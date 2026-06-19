# 🔧 Variáveis de Ambiente para Vercel

## 📋 **Configuração no Vercel Dashboard**

Vá para **Settings > Environment Variables** e adicione:

### **Variáveis Obrigatórias:**

```
VITE_SUPABASE_URL=https://oqoxhavdhrgdjvxvajze.supabase.co
VITE_SUPABASE_ANON_KEY=<copie do Supabase Dashboard → Project Settings → API → anon public>
```

### **Variáveis Opcionais:**

```
VITE_FEATURE_AI=true
VITE_APP_ENV=production
```

## 🚀 **Passos para Deploy**

### **1. Conectar ao Vercel:**
- Vá para: https://vercel.com
- Conecte seu repositório GitHub
- Selecione o projeto `pana-learn`

### **2. Configurar Build:**
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### **3. Adicionar Variáveis de Ambiente:**
- Vá para **Settings > Environment Variables**
- Adicione as variáveis listadas acima

### **4. Configurar Domínio:**
- Em **Settings > Domains**
- Adicione seu domínio personalizado (opcional)

## ✅ **Verificação Pós-Deploy**

### **1. Testar Autenticação:**
- Acesse a página de login
- Tente criar um novo usuário
- Verifique se não há erros 406

### **2. Verificar Console:**
- Abra o DevTools (F12)
- Verifique se não há erros de CORS
- Confirme que as requisições para Supabase funcionam

### **3. Testar Funcionalidades:**
- Login/Logout
- Cadastro de usuários
- Navegação entre páginas
- Upload de arquivos (se aplicável)

## 🔧 **Troubleshooting**

### **Se der erro de CORS:**
1. Verifique se as URLs estão corretas no Supabase
2. Confirme que as variáveis de ambiente estão configuradas
3. Verifique se o domínio está na lista de URLs permitidas

### **Se der erro 406:**
1. Execute o script SQL de correção no Supabase
2. Verifique as políticas RLS
3. Confirme que a função `handle_new_user` está funcionando

### **Se der erro de build:**
1. Verifique se todas as dependências estão instaladas
2. Confirme que o Node.js versão está correta
3. Verifique se não há erros de TypeScript

## 📞 **Suporte**

Se houver problemas:
1. Verifique os logs do Vercel
2. Confirme as configurações do Supabase
3. Teste localmente primeiro
