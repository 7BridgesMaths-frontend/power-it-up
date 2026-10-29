import fs from 'fs';
import path from 'path';

const BOOTSTRAP_SCRIPT = `
  <script>
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (response) { return response.json(); })
      .then(function (version) {
        version.css.forEach(function (href) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          document.head.appendChild(link);
        });
        var script = document.createElement('script');
        script.type = 'module';
        script.src = version.entry;
        document.body.appendChild(script);
      })
      .catch(function (error) { console.error('Failed to load game version', error); });
  </script>
`;

export function createBuildId() {
    return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
}

export function versionedBuild({ buildId, versionDir }) {
    let outDir;
    let publicDir;

    return {
        name: 'versioned-build',
        apply: 'build',

        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir);
            publicDir = path.resolve(config.root, 'public');
        },

        transformIndexHtml: {
            order: 'post',
            handler(html) {
                const versionedTag = new RegExp(`<(script|link)[^>]*(src|href)="\\./${versionDir}/[^"]*"[^>]*>(</script>)?\\s*`, 'g');
                return html
                    .replace(versionedTag, '')
                    .replace('</body>', `${BOOTSTRAP_SCRIPT}</body>`);
            }
        },

        writeBundle(_, bundle) {
            const entry = Object.values(bundle).find(chunk => chunk.type === 'chunk' && chunk.isEntry);
            const version = {
                buildId,
                entry: entry.fileName,
                css: [...(entry.viteMetadata?.importedCss ?? [])],
            };
            fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify(version, null, 2));
        },

        closeBundle() {
            if (fs.existsSync(publicDir)) {
                fs.cpSync(publicDir, path.join(outDir, versionDir), { recursive: true });
            }
        }
    };
}
