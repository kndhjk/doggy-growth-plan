import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { checkAchievements } from '../../services/achievementsService';
import { useI18n } from '../../i18n/I18nContext';

// Invisible side-effect component — sits inside PetPageV2 and re-evaluates the
// achievement catalogue whenever pet or statuses change. Newly-unlocked
// achievements pop a celebratory toast; storage is handled by the service.
export default function AchievementWatcher({ pet, statuses }) {
  const { currentUser } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!pet || !statuses) return;
    const fresh = checkAchievements(currentUser?.uid, pet, statuses);
    fresh.forEach(a => {
      toast.success(
        t('achieve.unlockedToast', { emoji: a.emoji, label: t(a.labelKey) }),
        {
          duration: 3500,
          style: {
            background: 'linear-gradient(135deg,#fff7ed,#fce7f3)',
            border: '2px solid #f9a8d4',
            color: '#9d174d',
            fontWeight: 800,
          },
        }
      );
    });
    // eslint-disable-next-line
  }, [pet, statuses, currentUser]);

  return null;
}
