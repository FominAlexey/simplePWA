export interface ManifestConfig {
  name: string;
  shortName: string;
  description: string;
  display: string;
  backgroundColor: string;
  themeColor: string;
  generateIcons: boolean;
}

export interface CreatePWAProjectResult {
  projectDir: string;
  manifest: object;
  manifestConfig: ManifestConfig;
}

export function createPWAProject(
  projectName: string,
  options?: { manifest?: Partial<ManifestConfig>; silent?: boolean }
): Promise<CreatePWAProjectResult>;
