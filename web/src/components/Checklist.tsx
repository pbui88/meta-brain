import type { CampaignJson } from '../types';
import { buildChecklist } from '../checklist';
import { card, colors, sectionTitle } from '../styles';

export function Checklist({ campaign }: { campaign: CampaignJson }) {
  const sections = buildChecklist(campaign);

  return (
    <div style={card}>
      <div style={sectionTitle}>Ads Manager Checklist</div>
      {sections.map((section) => (
        <div key={section.level} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary, marginBottom: 6 }}>
            {section.level} level
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {section.items.map((item, i) => (
              <li key={i} style={{ marginBottom: 4, fontSize: 13.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
