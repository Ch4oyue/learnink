# LearnInk Coding Rules & Conventions

## TypeScript Rules

### Strict Mode Wajib
- **`strict: true`** di `tsconfig.json`
- **Hindari `any`**. Gunakan `unknown` jika tipe tidak diketahui, lalu narrow down.
- **Explicit return types** untuk fungsi publik.

```typescript
// ❌ BAD
function getUser(id): any {
  return fetchUser(id);
}

// ✅ GOOD
function getUser(id: string): Promise<User | null> {
  return fetchUser(id);
}
```

### Type vs Interface
- Gunakan `interface` untuk object shapes yang bisa di-extend.
- Gunakan `type` untuk unions, primitives, dan tuples.

```typescript
// Interface untuk model data
interface User {
  id: string;
  email: string;
  role: AppRole;
}

// Type untuk union
type AppRole = 'admin' | 'tutor' | 'user';
```

---

## React Rules

### Functional Components Only
- Tidak menggunakan class components.
- Gunakan hooks untuk state dan side effects.

### Component Naming
- **PascalCase** untuk komponen: `UserCard.tsx`
- **camelCase** untuk hooks: `useUsers.ts`
- **lowercase-kebab** untuk routes: `/dashboard-profile`

### Props Interface
Selalu definisikan interface untuk props.

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}
```

---

## Supabase Rules

### Row Level Security (RLS) - WAJIB
- **Setiap tabel HARUS memiliki RLS enabled**.
- Policies HARUS menggunakan `(SELECT auth.uid())` (bukan `auth.uid()` langsung) untuk optimasi.

```sql
-- ✅ GOOD: Optimized RLS
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = (SELECT auth.uid()));

-- ❌ BAD: Unoptimized (causes auth_rls_initplan warning)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());
```

### Avoid Multiple Permissive Policies
- Jangan buat multiple `USING` policies untuk action yang sama.
- Combine dengan `OR`.

```sql
-- ❌ BAD: Two separate policies
CREATE POLICY "admin_select" ON table FOR SELECT USING (is_admin());
CREATE POLICY "owner_select" ON table FOR SELECT USING (user_id = auth.uid());

-- ✅ GOOD: Combined policy
CREATE POLICY "admin_or_owner_select" ON table FOR SELECT
USING (is_admin() OR user_id = (SELECT auth.uid()));
```

### Service Role Key
- **NEVER expose** `service_role` key ke frontend.
- Hanya gunakan di Edge Functions.

---

## Shadcn/UI Rules

### Konsistensi Komponen
- Gunakan komponen Shadcn untuk semua UI primitives (Button, Input, Select, etc.).
- Customize via `className`, jangan override internal styles.

### Color Tokens
Gunakan CSS variables dari design system, bukan hex langsung.

```tsx
// ❌ BAD
<div className="bg-[#1e1e1e] text-white">

// ✅ GOOD  
<div className="bg-background text-foreground">
```

---

## File Structure

```
src/
├── components/
│   ├── ui/           # Shadcn primitives (auto-generated)
│   ├── dashboard/    # Dashboard-specific components
│   ├── module/       # Module learning components
│   └── auth/         # Auth-related components
├── contexts/         # React Context providers
├── hooks/            # Custom hooks
├── lib/              # Utilities (utils.ts, supabase.ts)
├── pages/            # Route pages
│   └── admin/        # Admin-only pages
└── types/            # Shared TypeScript types
```

---

## Git Commit Convention

Format: `type(scope): description`

```
feat(auth): add Google OAuth login
fix(dashboard): resolve role update bug
docs(readme): update setup instructions
refactor(module): simplify content parser
chore(deps): update React to 18.3
```

---

## Security Checklist

Sebelum deploy, pastikan:
- [ ] Semua tabel memiliki RLS policies
- [ ] Tidak ada `console.log` dengan data sensitif
- [ ] API keys tidak ter-hardcode
- [ ] Input dari user di-sanitize (DOMPurify untuk HTML)
- [ ] Rate limiting aktif untuk public endpoints
- [ ] Error messages tidak expose internal details
