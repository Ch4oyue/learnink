export type Theme = "system" | "light" | "dark";
/** Resolve a theme choice without importing React or reading the DOM. */
export function resolveTheme(value:Theme,prefersDark:boolean):"light"|"dark"{
 return value==="dark"||(value==="system"&&prefersDark)?"dark":"light";
}
