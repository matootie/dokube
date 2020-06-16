const os = require("os");

let kubectlSpec = (version) => {
  const os_type = os.type();
  const os_arch = os.arch();

  let sys = "linux";
  let ex = "kubectl";
  let arch = "amd64";
  if (os_arch != "x64") arch = os_arch;

  switch (os_type) {
    case "Linux":
      sys = "linux";
      break;
    case "Darwin":
      sys = "darwin";
      break;
    case "Windows_NT":
      sys = "windows";
      ex = "kubectl.exe";
      break;
    default:
      sys = os_type.lower();
  }

  const spec = {
    system: sys,
    architecture: arch,
    executable: ex,
    url: `https://storage.googleapis.com/kubernetes-release/release/v${version}/bin/${sys}/${arch}/${ex}`
  };

  return spec;
};

exports.kubectlSpec = kubectlSpec;
