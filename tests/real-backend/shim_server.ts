export function serve(handler: (r: Request)=>Response|Promise<Response>) {
  Deno.serve({port: Number(Deno.env.get("PORT"))}, handler);
}
