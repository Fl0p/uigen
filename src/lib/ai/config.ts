export type ProviderType = "openrouter" | "anthropic" | "mock";

export interface ProviderConfig {
  provider: ProviderType;
  apiKey?: string;
  model: string;
}

/**
 * Определяет активный провайдер на основе ENV переменных
 */
export function getProviderType(): ProviderType {
  const explicitProvider = process.env.PROVIDER?.toLowerCase() as ProviderType | undefined;

  // Если явно указан провайдер
  if (explicitProvider) {
    // Проверяем наличие ключа для указанного провайдера
    if (explicitProvider === "openrouter" && process.env.OPENROUTER_API_KEY) {
      return "openrouter";
    }
    if (explicitProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      return "anthropic";
    }
    if (explicitProvider === "mock") {
      return "mock";
    }
    // Если ключ отсутствует - fallback на Mock с предупреждением
    console.warn(`[Config] ⚠️ PROVIDER=${explicitProvider} указан, но API ключ отсутствует. Используется Mock.`);
    return "mock";
  }

  // Автоматическое определение (приоритет)
  if (process.env.OPENROUTER_API_KEY?.trim()) {
    return "openrouter";
  }
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return "anthropic";
  }
  return "mock";
}

/**
 * Возвращает конфигурацию для активного провайдера
 */
export function getProviderConfig(): ProviderConfig {
  const provider = getProviderType();

  switch (provider) {
    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY!;
      const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

      return {
        provider: "openrouter",
        apiKey,
        model,
      };
    }

    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY!;
      const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

      return {
        provider: "anthropic",
        apiKey,
        model,
      };
    }

    case "mock":
    default:
      return {
        provider: "mock",
        model: "mock-claude-sonnet-4-0",
      };
  }
}

/**
 * Проверяет, поддерживает ли текущий провайдер prompt caching
 */
export function supportsPromptCaching(): boolean {
  const provider = getProviderType();
  return provider === "anthropic";
}
