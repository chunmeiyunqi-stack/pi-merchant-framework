import type { ChatResult } from './providers/openai';

export type AIProvider = {
  name: string;
  isAvailable: () => Promise<boolean>;
  healthCheck: () => Promise<boolean>;
  chat: (prompt: string, opts?: any) => Promise<ChatResult> | Promise<any>;
  generateStream?: (prompt: string, opts?: any) => AsyncGenerator<any> | any;
};

export class AIProviderFactory {
  private providers: Map<string, AIProvider> = new Map();
  private primary?: string;
  private fallbacks: string[] = [];
  // Keep availability checks dynamic in tests to avoid stale cache

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider);
  }

  setPrimary(name: string) {
    this.primary = name;
  }

  setFallbacks(names: string[]) {
    this.fallbacks = names;
  }

  private async isProviderAvailable(name: string) {
    const p = this.providers.get(name);
    const res = p ? await p.isAvailable() : false;
    return res;
  }

  async chat(prompt: string, opts: any = {}, providerName?: string, policy?: any) {
    if (providerName) {
      const p = this.providers.get(providerName);
      if (!p) throw new Error(`Provider ${providerName} not registered`);
      const available = await p.isAvailable();
      if (!available) throw new Error(`Provider ${providerName} not available`);
      return p.chat(prompt, opts);
    }

    const primary = this.primary ? this.providers.get(this.primary) : undefined;
    if (primary) {
      const avail = await this.isProviderAvailable(primary.name);
      if (avail) {
        try {
          return await primary.chat(prompt, opts);
        } catch (e) {
          // fallthrough to attempting others
        }
      }
    }

    // If primary is not available or failed, try explicit fallbacks first
    for (const name of this.fallbacks) {
      const p = this.providers.get(name);
      if (!p) continue;
      const avail = await this.isProviderAvailable(name);
      if (!avail) continue;
      try {
        return await p.chat(prompt, opts);
      } catch (e) {
        // try next
      }
    }

    // As a final resort, try any registered provider (in insertion order) except primary
    for (const [name, p] of this.providers.entries()) {
      if (this.primary && name === this.primary) continue;
      const avail = await this.isProviderAvailable(name);
      if (!avail) continue;
      try {
        return await p.chat(prompt, opts);
      } catch (e) {
        // next
      }
    }

    throw new Error('All providers failed');
  }

  generateStream(prompt: string, opts: any = {}) {
    const primaryName = this.primary;
    const self = this;
    async function* runner() {
      if (!primaryName) throw new Error('No primary provider');
      const primary = self.providers.get(primaryName)!;
      let firstYielded = false;
      try {
        if (!primary.generateStream) throw new Error('No generateStream');
        for await (const chunk of primary.generateStream(prompt, opts) as any) {
          firstYielded = true;
          yield chunk;
        }
      } catch (e) {
        if (!firstYielded) {
          // try fallbacks
          for (const name of self.fallbacks) {
            const p = self.providers.get(name);
            if (!p || !p.generateStream) continue;
            try {
              for await (const chunk of p.generateStream(prompt, opts) as any) {
                yield chunk;
              }
              return;
            } catch (_) {
              continue;
            }
          }
        }
        throw e;
      }
    }
    return runner();
  }
}

export default AIProviderFactory;
