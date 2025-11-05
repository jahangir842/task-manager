In a **Vite + React** application, environment variables are used to configure your app for different environments (development, production, testing). Vite has some specific rules about environment variables:

---

### 1. **Vite Special Prefix**

* Only variables prefixed with `VITE_` are exposed to your client-side code.
* Variables without this prefix are **private** and only accessible in Vite’s config or Node scripts.

**Example:**

```env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=MyReactApp
```

Access them in your React code:

```javascript
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_APP_NAME);
```

---

### 2. **Built-in `import.meta.env` Variables**

Vite automatically provides some environment variables without you needing to define them:

| Variable                   | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `import.meta.env.MODE`     | Current mode (`development`, `production`, etc.) |
| `import.meta.env.BASE_URL` | Base public path (usually `/`)                   |
| `import.meta.env.PROD`     | `true` if in production mode                     |
| `import.meta.env.DEV`      | `true` if in development mode                    |
| `import.meta.env.SSR`      | `true` if running in server-side rendering       |

**Example:**

```javascript
if (import.meta.env.DEV) {
  console.log("Running in development mode");
}
```

---

### 3. **Creating `.env` Files**

Vite supports multiple `.env` files for different modes:

| File Name                | Usage                           |
| ------------------------ | ------------------------------- |
| `.env`                   | Default for all environments    |
| `.env.local`             | Local overrides, ignored by git |
| `.env.development`       | Only in development             |
| `.env.development.local` | Local development overrides     |
| `.env.production`        | Only in production              |
| `.env.production.local`  | Local production overrides      |

Vite automatically loads the file that matches the current mode.

---

### 4. **Example `.env` Setup**

```env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=MyReactApp
VITE_FEATURE_FLAG=true
```

In React:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
const featureFlag = import.meta.env.VITE_FEATURE_FLAG === "true";
```

---

💡 **Memorization trick:**
Think **“VITE_” = “Visible In The Environment”** for the front-end. Only variables with this prefix are injected into your client code.

---

