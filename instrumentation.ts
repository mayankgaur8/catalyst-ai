import { registerObservability } from "@/lib/observability/register";

export async function register() {
  await registerObservability();
}
