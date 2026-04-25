import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const outputDir = path.resolve('printer/output');
const manifestPath = path.join(outputDir, 'remix_manifest.json');
const failures = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

if (!fs.existsSync(manifestPath)) {
  failures.push('remix_manifest.json: missing');
} else {
  const manifest = readJson(manifestPath);
  if (manifest.schema_version !== 1) failures.push('remix_manifest.json: schema_version must be 1');
  if (!Array.isArray(manifest.remixes)) failures.push('remix_manifest.json: remixes must be an array');

  for (const remix of manifest.remixes || []) {
    if (!remix.slug) failures.push('manifest entry: missing slug');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(remix.slug || '')) {
      failures.push(`${remix.slug}: invalid slug`);
    }
    if (!remix.file || !remix.file.endsWith('.html')) failures.push(`${remix.slug}: missing html file`);
    if (!remix.description_file || !remix.description_file.endsWith('.remix.json')) {
      failures.push(`${remix.slug}: missing description file`);
    }

    const htmlPath = path.join(outputDir, remix.file || '');
    const descriptionPath = path.join(outputDir, remix.description_file || '');
    if (!fs.existsSync(htmlPath)) {
      failures.push(`${remix.file}: missing`);
    } else {
      const html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('<!DOCTYPE html>')) failures.push(`${remix.file}: missing doctype`);
      if (!html.includes('<meta name="viewport"')) failures.push(`${remix.file}: missing viewport`);
      if (!html.includes('data-printer-artifact="fake-game-library"')) failures.push(`${remix.file}: missing artifact marker`);
      if (!html.includes('class="phone-shell"')) failures.push(`${remix.file}: missing phone shell`);
      if (!html.includes('window.__PRINTER_ARTIFACT__')) failures.push(`${remix.file}: missing artifact metadata`);
      for (const metadataField of ['parent_file', 'remix_prompt', 'agent_description_file']) {
        if (!html.includes(metadataField)) failures.push(`${remix.file}: missing ${metadataField} metadata`);
      }
      if (!html.includes('window.render_game_to_text')) failures.push(`${remix.file}: missing render_game_to_text`);
      if (!html.includes('window.advanceTime')) failures.push(`${remix.file}: missing advanceTime`);
      if (/https?:\/\//i.test(html)) failures.push(`${remix.file}: contains external URL`);
    }

    if (!fs.existsSync(descriptionPath)) {
      failures.push(`${remix.description_file}: missing`);
    } else {
      const description = readJson(descriptionPath);
      for (const field of ['schema_version', 'id', 'slug', 'title', 'source_file', 'parent_slug', 'lineage', 'created_at', 'prompt', 'agent_description', 'files', 'validation']) {
        if (!(field in description)) failures.push(`${remix.description_file}: missing ${field}`);
      }
      const agent = description.agent_description || {};
      for (const field of ['one_liner', 'core_loop', 'controls', 'mechanics', 'visual_language', 'state_model', 'share_hook', 'known_constraints', 'next_evolution_hooks']) {
        if (!(field in agent)) failures.push(`${remix.description_file}: missing agent_description.${field}`);
      }
    }
  }
}

if (failures.length) {
  console.error('Remix output verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const count = fs.existsSync(manifestPath) ? (readJson(manifestPath).remixes || []).length : 0;
console.log(`Remix output verification passed: ${count} published remixes checked.`);
