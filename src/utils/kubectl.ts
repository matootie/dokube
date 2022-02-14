/**
 * Kubernetes CLI utilities.
 */

import { type, arch } from "os"

/**
 * The Kubectl configuration type.
 */
interface KubeConfig {
  apiVersion: "v1"
  clusters: {
    name: string
    cluster: {
      "certificate-authority-data": string
      server: string
    }
  }[]
  contexts: {
    name: string
    context: {
      cluster: string
      namespace: string
      user: string
    }
  }[]
  "current-context": string
  kind: "Config"
  preferences: {
    [key: string]: any
  }
  users: {
    name: string
    user: {
      token: string
    }
  }[]
}

/**
 * Construct a Kubectl configuration.
 */
interface ConstructKubeConfigInput {
  auth: string
  server: string
  name: string
  region: string
  namespace: string
  preferences?: { [key: string]: any }
  token: string
}
export function constructKubeconfig({
  auth,
  server,
  name,
  region,
  namespace,
  preferences = {},
  token,
}: ConstructKubeConfigInput): KubeConfig {
  return {
    apiVersion: "v1",
    clusters: [
      {
        cluster: {
          "certificate-authority-data": auth,
          server,
        },
        name: `do-${region}-${name}`,
      },
    ],
    contexts: [
      {
        context: {
          cluster: `do-${region}-${name}`,
          namespace,
          user: `do-${region}-${name}-admin`,
        },
        name: `do-${region}-${name}`,
      },
    ],
    "current-context": `do-${region}-${name}`,
    kind: "Config",
    preferences,
    users: [
      {
        name: `do-${region}-${name}-admin`,
        user: {
          token,
        },
      },
    ],
  }
}

/**
 * Get Kubectl specifications.
 */
interface KubectlSpecOutput {
  system: string
  architecture: string
  executable: string
  url: string
}
export function kubectlSpec(version: string): KubectlSpecOutput {
  // Get the OS type and architecture.
  const os_type = type()
  const os_arch = arch()

  // Create a starter specification.
  const spec = {
    system: "linux",
    executable: "kubectl",
    architecture: os_arch === "x64" ? "amd64" : os_arch,
  }

  // Determine the system name and executable based on the OS type.
  switch (os_type) {
    case "Linux":
      spec.system = "linux"
      break
    case "Darwin":
      spec.system = "darwin"
      break
    case "Windows_NT":
      spec.system = "windows"
      spec.executable = "kubectl.exe"
      break
    default:
      spec.system = os_type.toLowerCase()
      break
  }

  // Return the specification.
  return {
    ...spec,
    url: `https://storage.googleapis.com/kubernetes-release/release/v${version}/bin/${spec.system}/${spec.architecture}/${spec.executable}`,
  }
}
