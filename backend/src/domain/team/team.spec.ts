import { SkillLevel } from './skill-level.js';
import { Skill } from './skill.js';
import { Team } from './team.js';

describe('SkillLevel', () => {
  it('accepts levels 1 through 5', () => {
    for (const value of [1, 2, 3, 4, 5]) {
      expect(SkillLevel.of(value).value).toBe(value);
    }
  });

  it('rejects out-of-range and non-integer levels', () => {
    expect(() => SkillLevel.of(0)).toThrow(/integer in \[1, 5\]/);
    expect(() => SkillLevel.of(6)).toThrow(/integer in \[1, 5\]/);
    expect(() => SkillLevel.of(2.5)).toThrow(/integer in \[1, 5\]/);
  });
});

describe('Skill', () => {
  it('rejects empty id or name', () => {
    expect(() => Skill.create('', 'Python')).toThrow(/non-empty id/);
    expect(() => Skill.create('py', '  ')).toThrow(/non-empty name/);
  });
});

describe('Team (skill catalog)', () => {
  const py = Skill.create('py', 'Python');
  const ts = Skill.create('ts', 'TypeScript');

  it('rejects a catalog with duplicate skill ids', () => {
    expect(() => Team.create([py, Skill.create('py', 'Python 3')])).toThrow(/Duplicate skill id/);
  });

  it('reports membership via hasSkill', () => {
    const team = Team.create([py]);
    expect(team.hasSkill('py')).toBe(true);
    expect(team.hasSkill('go')).toBe(false);
  });

  it('adds a skill immutably and rejects a duplicate', () => {
    const team = Team.create([py]);
    const extended = team.withSkill(ts);
    expect(extended.skills).toHaveLength(2);
    expect(team.skills).toHaveLength(1); // original unchanged
    expect(() => extended.withSkill(py)).toThrow(/already in catalog/);
  });

  it('is immutable', () => {
    const team = Team.create([py]);
    expect(() => {
      (team.skills as Skill[]).push(ts);
    }).toThrow();
  });
});
