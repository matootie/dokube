/**
 * Main action runner.
 */

// Standard imports.
import { chmodSync, writeFileSync } from "fs"

// Actions imports.
import core from "@actions/core"
import io from "@actions/io"
import tc from "@actions/tool-cache"

// Utility imports.
import { constructKubeconfig, kubectlSpec } from "@utils/kubectl"
import { WORKDIR } from "@utils/constants"
import { getClusterByName, getClusterCredentials } from "@utils/do"

/**
 * Main runner.
 */
export async function run() {
  try {
    // Create the working directory.
    console.log("Creating working directory...")
    await io.mkdirP(WORKDIR)

    // Get user input.
    console.log("Fetching user inputs...")
    const accessToken = core.getInput("personalAccessToken")
    const clusterName = core.getInput("clusterName")
    const expirationTime = core.getInput("expirationTime")
    const namespaceName = core.getInput("namespace")
    const kubectlVersion = core.getInput("version")

    // Get the cluster by name.
    const cluster = await getClusterByName({
      clusterName,
      accessToken,
    })
    // Throw if no cluster could be found.
    if (!cluster) {
      throw new Error(`No cluster found with name '${clusterName}'.`)
    }

    // Get cluster credentials.
    const credentials = await getClusterCredentials({
      cluster,
      accessToken,
      expirationTime,
    })

    // Construct a Kubernetes CLI config.
    const kubeconfig = constructKubeconfig({
      auth: credentials.certificate_authority_data,
      server: credentials.server,
      name: cluster.name,
      region: cluster.region,
      namespace: namespaceName,
      token: credentials.token,
    })

    // Save the Kubernetes CLI config.
    console.log("Writing Kubernetes CLI config to disk...")
    writeFileSync(`${WORKDIR}/kubeconfig`, JSON.stringify(kubeconfig, null, 2))

    // Set KUBECONFIG environment variable.
    console.log("Setting Kubernetes CLI config as default...")
    core.exportVariable("KUBECONFIG", `${WORKDIR}/kubeconfig`)

    // Download and install Kubernetes CLI.
    const spec = kubectlSpec(kubectlVersion)
    let kubectlDirectory = tc.find("kubectl", kubectlVersion, spec.architecture)
    if (!kubectlDirectory) {
      console.log("Downloading Kubernetes CLI...")
      const kubectl = await tc.downloadTool(spec.url)
      chmodSync(kubectl, 0o777)
      kubectlDirectory = await tc.cacheFile(
        kubectl,
        spec.executable,
        "kubectl",
        kubectlVersion,
        spec.architecture,
      )
    }

    // Add Kubernetes CLI to PATH.
    console.log("Adding Kubernetes CLI to path...")
    core.addPath(kubectlDirectory)

    // Done!
    console.log("Done!")
  } catch (error: any) {
    core.setFailed(error)
  }
}
