# Ration

Figma から書き出した画面構成を React + Vite に移植した家計簿アプリです。

Googleログインでユーザー管理し、支出・収入・お気に入り品目・支払い方法を Firestore に保存します。

## 使う技術

- React
- Vite
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore
- Recharts
- Lucide React

## VSCode で開く

このフォルダを VSCode で開きます。

```bash
code .
```

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
npm run dev
```

表示された URL をブラウザで開きます。通常は `http://localhost:5173/` です。

## Firebase の設定

`.env` に Firebase の Web アプリ設定を入れます。`.env` は `.gitignore` 済みなので GitHub には上がりません。

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_BUDGET_ID=default-budget
```

Firebase Console で次を有効にしてください。

1. Authentication の Sign-in method で Google を有効化
2. Firestore Database を作成
3. Authentication の Authorized domains に公開先ドメインを追加

Firestore には `users/{uid}/budgets/default-budget` に保存されます。

Firestore ルール例です。

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/budgets/{budgetId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## GitHub に公開する

初回だけ Git リポジトリを作ります。

```bash
git init
git add .
git commit -m "Initial Ration app"
```

GitHub で空のリポジトリを作り、表示された案内に従って remote を追加します。

```bash
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## ビルド確認

公開前にビルドできるか確認します。

```bash
npm run build
```
