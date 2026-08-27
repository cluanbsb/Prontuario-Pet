# Passo a passo: publicar no GitHub e configurar o Firebase

Este app agora tem **login com CPF e senha** (usando o Firebase
Authentication por baixo dos panos) e guarda os dados de cada
usuário no **Firebase (Firestore)** em vez de ficar salvo só no seu
computador. Para funcionar, você precisa: (1) criar um projeto no Firebase,
(2) colar as chaves dele no arquivo `js/firebase-config.js`, e (3) publicar
os arquivos em algum lugar acessível pela internet — o GitHub Pages é grátis
e funciona bem para isso.

> **Nota técnica:** o Firebase Authentication exige um e-mail internamente,
> então o app converte o CPF digitado em um "e-mail" interno
> (ex: `cpf12345678900@prontuariopet.app`) só para uso do Firebase — a
> pessoa nunca vê nem digita isso, só o CPF e a senha.

---

## Parte 1 — Criar o projeto no Firebase

1. **Acesse o console do Firebase**
   Vá em [console.firebase.google.com](https://console.firebase.google.com)
   e faça login com sua conta Google.

2. **Crie um novo projeto**
   Clique em "Adicionar projeto", dê um nome (ex: `prontuario-pet`) e siga
   os passos (pode desativar o Google Analytics, não é necessário).

3. **Ative a Autenticação por e-mail/senha**
   No menu lateral, vá em **Build > Authentication** → aba **Sign-in method**
   → clique em **Email/Password** → ative a primeira opção → **Salvar**.

4. **Crie o banco de dados Firestore**
   No menu lateral, vá em **Build > Firestore Database** → **Criar banco de
   dados** → escolha uma localização (qualquer uma próxima do Brasil, ex:
   `southamerica-east1`) → inicie em **modo de produção**.

5. **Configure as regras de segurança do Firestore**
   Ainda em Firestore Database, vá na aba **Regras** e substitua o conteúdo
   por:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /usuarios/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /cpf_lookup/{cpf} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == request.resource.data.uid;
       }
       match /compartilhados/{shareId} {
         allow read: if request.auth != null &&
           (request.auth.uid == resource.data.ownerUid || request.auth.uid == resource.data.sharedWithUid);
         allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;
         allow update: if request.auth != null &&
           (request.auth.uid == resource.data.ownerUid || request.auth.uid == resource.data.sharedWithUid);
         allow delete: if request.auth != null && request.auth.uid == resource.data.ownerUid;
       }
     }
   }
   ```

   Isso garante que cada pessoa só consegue ler e gravar os **próprios**
   dados (`usuarios`), que qualquer pessoa logada pode ser encontrada pelo
   CPF para receber compartilhamentos (`cpf_lookup`), e que um prontuário
   compartilhado (`compartilhados`) só pode ser lido e editado por quem o
   compartilhou ou por quem o recebeu — só quem compartilhou pode criar ou
   apagar o compartilhamento em si.
   Clique em **Publicar**.

6. **Pegue as chaves do seu app web**
   No menu lateral, clique na engrenagem ⚙️ ao lado de "Visão geral do
   projeto" → **Configurações do projeto** → role até "Seus apps" → clique
   no ícone **</>`** (Web) → dê um apelido ao app → **Registrar app**.
   O Firebase vai mostrar um bloco `firebaseConfig = {...}` — copie esses
   valores.

7. **Cole as chaves no projeto**
   Abra o arquivo `js/firebase-config.js` e substitua os valores de
   exemplo (`SUA_API_KEY`, `SEU_PROJETO`, etc.) pelos valores reais que
   você copiou no passo anterior. Salve o arquivo.

---

## Parte 2 — Publicar no GitHub (GitHub Pages)

1. **Crie uma conta no GitHub** (se ainda não tiver): [github.com](https://github.com)

2. **Crie um novo repositório**
   Clique em **New repository**, dê um nome (ex: `prontuario-pet`), deixe
   como **Public**, e clique em **Create repository**. Não marque a opção
   de criar README (para não ter conflito).

3. **Envie os arquivos do projeto**
   Na página do repositório recém-criado, clique em **uploading an existing
   file** e arraste **toda a pasta** `prontuario-pet` (o `index.html`, a
   pasta `css/` e a pasta `js/` com o `firebase-config.js` já editado).
   Depois clique em **Commit changes**.

   *Alternativa via linha de comando, se preferir:*
   ```bash
   cd prontuario-pet
   git init
   git add .
   git commit -m "Primeira versão do Prontuário Pet"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/prontuario-pet.git
   git push -u origin main
   ```

4. **Ative o GitHub Pages**
   No repositório, vá em **Settings** (Configurações) → **Pages** (menu
   lateral) → em "Branch", selecione **main** e a pasta **/ (root)** →
   **Save**.

5. **Aguarde a publicação**
   Em 1–2 minutos, o GitHub mostra o endereço do site, algo como:
   `https://SEU_USUARIO.github.io/prontuario-pet/`
   Esse é o link do seu app, já publicado e acessível de qualquer lugar.

6. **Autorize esse domínio no Firebase**
   Volte no console do Firebase → **Authentication** → aba **Settings**
   → **Authorized domains** → **Add domain** → cole o domínio do GitHub
   Pages (`SEU_USUARIO.github.io`, sem o `https://` e sem o caminho depois).
   Sem esse passo, o login não funciona no site publicado.

---

## Pronto!

Agora é só acessar o link do GitHub Pages, criar uma conta (e-mail e senha)
na tela de login, e começar a cadastrar os animais. Cada conta vê apenas os
próprios dados — tudo fica salvo no Firestore, então funciona de qualquer
computador ou celular, bastando fazer login.

### Compartilhar um prontuário com outra pessoa

No perfil de um animal, clique no ícone 🔗 (ao lado de editar/excluir) e
digite o CPF da outra pessoa — ela **precisa já ter uma conta criada** no
app. A partir daí, o prontuário aparece também na lista de animais dela,
e **as duas contas podem editar** (perfil, vacinas, medicações e histórico).
Só quem compartilhou pode excluir o animal ou parar de compartilhar
(pelo mesmo botão 🔗).

### Instalar como aplicativo (Android e iOS)

O app agora é um **PWA** (Progressive Web App) — com `manifest.json`, ícones
e um Service Worker, ele pode ser "instalado" na tela inicial do celular e
abre em tela cheia, como um aplicativo normal (sem barra de endereço do navegador).

**Android (Chrome):**
1. Abra o link do site publicado
2. Toque nos três pontinhos (⋮) no canto superior direito do navegador
3. Toque em **"Instalar aplicativo"** (ou "Adicionar à tela inicial")
4. Confirme — o ícone aparece na tela inicial como um app normal

**iPhone/iPad (Safari — precisa ser o Safari, outros navegadores no iOS não suportam):**
1. Abra o link do site publicado no Safari
2. Toque no ícone de compartilhar (quadrado com seta para cima)
3. Toque em **"Adicionar à Tela de Início"**
4. Confirme — o ícone aparece na tela inicial

Nada muda no código para isso funcionar além dos arquivos já incluídos
(`manifest.json`, `sw.js`, `icon-*.png`) — eles precisam estar na mesma
pasta do `index.html` publicado.

### Dúvidas comuns

- **"Erro de permissão" ao salvar dados** → confira se as regras do
  Firestore (Parte 1, passo 5) foram publicadas corretamente.
- **Login não funciona no site publicado, mas funciona local** → confira
  se você autorizou o domínio do GitHub Pages no Firebase (Parte 2,
  passo 6).
- **Quer trocar o nome do site?** → o GitHub Pages também permite configurar
  um domínio próprio em Settings → Pages → Custom domain.
- **A opção "Instalar aplicativo" não aparece no Android** → confira se
  `manifest.json`, `sw.js` e os `icon-*.png` foram realmente publicados
  na mesma pasta do `index.html` (abra `seusite.com/manifest.json`
  diretamente no navegador — se der 404, o arquivo não subiu).
