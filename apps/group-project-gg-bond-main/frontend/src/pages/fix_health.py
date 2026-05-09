#!/usr/bin/env python3
"""Fix HealthRecordsPage.js - add displayRecords translation."""
import re

path = '/home/destiny/apps/group-project-gg-bond-main/frontend/src/pages/HealthRecordsPage.js'
content = open(path).read()

# 1. Add translateContent import after isMobile import
if 'translateContent' not in content:
    content = content.replace(
        "import { isMobile } from '../utils/responsive';",
        "import { isMobile } from '../utils/responsive';\nimport { translateContent } from '../utils/translate';"
    )

# 2. Change `const { t } = useI18n();` to include lang
content = content.replace(
    "const { t } = useI18n();",
    "const { t, lang } = useI18n();"
)

# 3. Add displayRecords state after `const [showModal, setShowModal] = useState(false);`
content = content.replace(
    "const [showModal, setShowModal] = useState(false);",
    "const [showModal, setShowModal] = useState(false);\n  const [displayRecords, setDisplayRecords] = useState({});"
)

# 4. Find the useEffect that has `}, [records]);` and adds the displayRecords translation
# We need to add it after that useEffect block
# Find: `  }, [records]);` after the HealthAPI.list() block
# and add a new useEffect after it

# The pattern: 
#         setRecords(byType);
#       }
#     });
#   }, [records]);
# We want to add after it:

old_pattern = """        setRecords(byType);
      }
    });
  }, [records]);"""

new_block = """        setRecords(byType);
      }
    });
  }, [records]);

  // Translate display content when lang or records change
  useEffect(() => {
    if (!records || Object.keys(records).length === 0) return;
    let cancelled = false;
    const doTranslate = async () => {
      const translated = {};
      for (const [recType, recs] of Object.entries(records)) {
        const mapped = await Promise.all(recs.map(async r => ({
          ...r,
          displayTitle: await translateContent(r.title || '', lang),
          displayNotes: await translateContent(r.notes || '', lang),
        })));
        translated[recType] = mapped;
      }
      if (!cancelled) setDisplayRecords(translated);
    };
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, records]);"""

content = content.replace(old_pattern, new_block)

# 5. Replace `{record.title}` with `{record.displayTitle || record.title}`
content = content.replace(
    "{record.title}",
    "{record.displayTitle || record.title}"
)

# 6. Replace `{record.notes}` with `{record.displayNotes || record.notes}`
content = content.replace(
    "{record.notes}",
    "{record.displayNotes || record.notes}"
)

with open(path, 'w') as f:
    f.write(content)
print("HealthRecordsPage.js fixed")