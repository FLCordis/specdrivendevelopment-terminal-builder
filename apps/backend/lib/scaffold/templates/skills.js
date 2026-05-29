const skill = (name, desc, body) => ({ name, content: `---\nname: ${name}\ndescription: ${desc}\n---\n\n${body}\n` });

export const SKILLS = [
  skill('sdd-spec-writing', 'Como escrever specs em /.specs/ antes de codar',
    '# SDD Spec Writing\n\nNenhum código sem `spec.md` validada na pasta da feature. Preencha `<acceptance_criteria>` e resolva todo `[NEEDS CLARIFICATION]` antes de implementar.'),
  skill('safety-harness', 'Regras de não-destruição do projeto',
    '# Safety Harness\n\nProibido sem validação humana: DROP/TRUNCATE, `rm -rf`, push/merge no branch principal, `--force`. Em dúvida ou ambiguidade: PARE e pergunte.'),
  skill('changelog-discipline', 'Registrar toda mudança no CHANGELOG.md',
    '# Changelog Discipline\n\nToda feature concluída, bug corrigido ou alteração entra em `CHANGELOG.md` na raiz, referenciando a pasta `.specs/NNN-feature/` correspondente.'),
];
