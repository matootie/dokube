const path = require('path');
const process = require('process');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const exec = require('@actions/exec');
const io = require('@actions/io');
const fs = require('fs');

async function run() {
  try {
    // Get Input Values for future use.
    const token = core.getInput('personalAccessToken', { required: true });
    const cluster = core.getInput('clusterName', { required: true });
    const workdir = process.env['GITHUB_WORKSPACE'];
    const doctlTar = await tc.downloadTool("https://github.com/digitalocean/doctl/releases/download/v1.33.1/doctl-1.33.1-linux-386.tar.gz");
    const doctl = await tc.extractTar(doctlTar, workdir);
    await io.mkdirP(`${workdir}/dokubetemp`);
    let kubeconfig = fs.createWriteStream(`${workdir}/dokubetemp/kubeconfig`);
    const options = {};
    options.outStream = kubeconfig;
    await exec.exec(`${doctl}/doctl`, ['kubernetes', 'cluster', 'kubeconfig', 'show', cluster, '--access-token', token], options);
    await exec.exec(`cat ${workdir}/dokubetemp/kubeconfig`);
    var data = fs.readFileSync(`${workdir}/dokubetemp/kubeconfig`, 'utf-8');
    let lines = data.split('\n');
    lines.splice(0,1);
    let formatted = lines.join('\n');
    fs.writeFileSync(`${workdir}/dokubetemp/kubeconfig`, formatted, 'utf-8');
    await exec.exec(`cat ${workdir}/dokubetemp/kubeconfig`);
    const kubectl = await tc.downloadTool("https://storage.googleapis.com/kubernetes-release/release/v1.16.0/bin/linux/amd64/kubectl");
    await io.mv(kubectl, `${workdir}/dokubetemp/kubectl`);
    const cachedPath = await tc.cacheDir(`${workdir}/dokubetemp`, 'kubectl', 'v1.16.0');
    core.addPath(`${cachedPath}/kubectl`);
    core.exportVariable('KUBECONFIG', `${cachedPath}/kubeconfig`)
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
