import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { listRecentlyOpenedTemplates } from '../services/slideCreationService.js';
import { filterTemplates, sortTemplates } from '../utils/templateSearch';
import SlidePreviewThumbnail from './SlidePreviewThumbnail.jsx';
import './Home.css';

const popularSlides = [
  {
    id: 'popular-1',
    title: '第3四半期報告書',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/10',
    views: '15万..',
    slides: 12,
  },
  {
    id: 'popular-2',
    title: 'マーケティングプレゼンテーション',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80',
    date: '2023/12/10',
    views: '8.2万..',
    slides: 15,
  },
  {
    id: 'popular-3',
    title: '新製品ローンチ計画',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/14',
    views: '6.5万..',
    slides: 8,
  },
  {
    id: 'popular-4',
    title: 'チーム研修資料',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/14',
    views: '4.1万..',
    slides: 14,
  },
  {
    id: 'popular-5',
    title: '年間売上分析',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    date: '2023/11/01',
    views: '3.8万..',
    slides: 20,
  },
  {
    id: 'popular-6',
    title: 'プロジェクト進捗報告',
    image: 'https://images.unsplash.com/photo-1632516643720-e7f0d0e1580e?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    views: '2.9万..',
    slides: 18,
  },
  {
    id: 'popular-7',
    title: '顧客満足度調査',
    image: 'https://images.unsplash.com/photo-1518133835878-5a93ac3fb206?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/18',
    views: '2.4万..',
    slides: 10,
  },
  {
    id: 'popular-8',
    title: '事業戦略レビュー',
    image: 'https://images.unsplash.com/photo-1632516643720-e7f0d0e1580e?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    views: '1.7万..',
    slides: 18,
  },
];

const searchTemplates = [
  {
    id: 1,
    title: '数学レポート：3次方程式のグラフ',
    author: '田中太郎',
    topic: 'すうがく',
    tags: ['数学', '代数', 'グラフ', '3次方程式'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/10',
    slides: 12,
    rating: 4.8,
    viewCount: 150000,
  },
  {
    id: 2,
    title: '数学グループディスカッション：問',
    author: '佐藤花子',
    topic: 'すうがく',
    tags: ['数学', 'グループ学習', 'ディスカッション'],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80',
    date: '2023/12/10',
    slides: 15,
    rating: 4.5,
    viewCount: 82000,
  },
  {
    id: 3,
    title: '定理の証明フローと数理モデル設計',
    author: '鈴木一郎',
    topic: 'すうがく',
    tags: ['数学', '証明', '数理モデル'],
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/14',
    slides: 8,
    rating: 4.7,
    viewCount: 65000,
  },
  {
    id: 4,
    title: '数学試験結果報告：クラス別平均点',
    author: '高橋美咲',
    topic: 'すうがく',
    tags: ['数学', '試験', '成績分析'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/14',
    slides: 14,
    rating: 4.3,
    viewCount: 41000,
  },
  {
    id: 5,
    title: '幾何学入門：基本図形と体積公式',
    author: '伊藤健',
    topic: 'すうがく',
    tags: ['数学', '幾何学', '体積'],
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    date: '2023/11/01',
    slides: 20,
    rating: 4.6,
    viewCount: 38000,
  },
  {
    id: 6,
    title: '代数学基礎演習：多項式と方程式',
    author: '渡辺翔',
    topic: 'すうがく',
    tags: ['数学', '代数', '多項式', '方程式'],
    image: 'https://images.unsplash.com/photo-1632516643720-e7f0d0e1580e?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    slides: 18,
    rating: 4.4,
    viewCount: 29000,
  },
  {
    id: 7,
    title: '確率と統計の基礎：データ分析入門',
    author: '山本彩',
    topic: 'すうがく',
    tags: ['数学', '確率', '統計', 'データ分析'],
    image: 'https://images.unsplash.com/photo-1518133835878-5a93ac3fb206?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/18',
    slides: 10,
    rating: 4.9,
    viewCount: 24000,
  },
  {
    id: 8,
    title: '代数学基礎演習：多項式と方程式',
    author: '渡辺翔',
    topic: 'すうがく',
    tags: ['数学', '代数', '演習'],
    image: 'https://images.unsplash.com/photo-1632516643720-e7f0d0e1580e?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    slides: 18,
    rating: 4.2,
    viewCount: 17000,
  },
];

const recommendedTemplates = [
  {
    id: 'recommended-1',
    title: 'スタートアップピッチデック',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/10',
    views: '12万..',
    slides: 10,
  },
  {
    id: 'recommended-2',
    title: '年間財務報告',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
    date: '2023/11/05',
    views: '9.4万..',
    slides: 16,
  },
  {
    id: 'recommended-3',
    title: '製品ロードマップ',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/18',
    views: '7.1万..',
    slides: 12,
  },
  {
    id: 'recommended-4',
    title: 'チームオンボーディング',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    views: '5.6万..',
    slides: 14,
  },
];

const sortOptionIds = ['name', 'created', 'rating', 'views'];

function formatDate(value, language) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'ja-JP', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getRecentTemplateCard(template, language) {
  return {
    id: template.id,
    title: template.title,
    firstSlide: template.first_slide,
    image: template.thumbnail_url,
    date: formatDate(template.last_opened_at ?? template.updated_at ?? template.created_at, language),
    slides: template.slide_count ?? template.page_count ?? 0,
    template,
    views: '',
  };
}

function SlideCard({ template, title, firstSlide, image, date, slides, views, t, onOpenTemplate }) {
  return (
    <button type="button" className="template-card" onClick={() => onOpenTemplate?.(template)}>
      <div className="template-card-image">
        {firstSlide ? (
          <SlidePreviewThumbnail slide={firstSlide} title={title} />
        ) : image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="template-card-image__fallback" aria-hidden="true">
            <span />
            <strong>{title}</strong>
          </div>
        )}
      </div>
      <div className="template-card-content">
        <h3 className="template-card-title">{title}</h3>
        <div className="template-card-meta">
          {views ? (
            <>
              <span className="template-date">{date}</span>
              <span className="template-views">{views}</span>
              <span className="template-slides">{t('home.slides', { count: slides })}</span>
            </>
          ) : (
            <>
              <span className="template-date">{t('home.lastUpdated', { date })}</span>
              <span className="template-slides">{t('home.slides', { count: slides })}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Home({
  currentUserId,
  isLoggedIn,
  submittedSearchQuery,
  isSearchActive,
  onCreateNewSlide,
  onOpenTemplate,
  onOpenRecentTemplate,
  isCreatingSlide,
  createSlideError,
  refreshKey = 0,
}) {
  const { language, t } = useLanguage();
  const [activeSort, setActiveSort] = useState('name');
  const [recentTemplates, setRecentTemplates] = useState([]);
  const [recentError, setRecentError] = useState('');
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const hasSearchQuery = submittedSearchQuery.length > 0;
  const showSearchResults = isSearchActive && hasSearchQuery;
  const showGuestLanding = !isLoggedIn && !showSearchResults;
  const showLoggedInDashboard = isLoggedIn && !showSearchResults;
  const showLibraryHeader = showSearchResults;

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => {
        if (!isMounted) return [];

        if (!currentUserId || !showLoggedInDashboard) {
          setRecentTemplates([]);
          setRecentError('');
          setIsRecentLoading(false);
          return [];
        }

        setIsRecentLoading(true);
        setRecentError('');
        return listRecentlyOpenedTemplates(currentUserId);
      })
      .then((templates) => {
        if (isMounted) {
          setRecentTemplates(templates);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setRecentTemplates([]);
          setRecentError(t('home.recentSlidesError', { message: error.message }));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRecentLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, showLoggedInDashboard, t, refreshKey]);

  const recentSlides = useMemo(
    () => recentTemplates.map((template) => getRecentTemplateCard(template, language)),
    [language, recentTemplates],
  );

  const templates = useMemo(() => {
    if (showGuestLanding) {
      return popularSlides;
    }

    const filteredTemplates = hasSearchQuery
      ? filterTemplates(searchTemplates, submittedSearchQuery)
      : searchTemplates;

    return sortTemplates(filteredTemplates, activeSort, language);
  }, [activeSort, hasSearchQuery, language, showGuestLanding, submittedSearchQuery]);

  const sortOptions = useMemo(
    () =>
      sortOptionIds.map((id) => ({
        id,
        label: t(`home.sort${id.charAt(0).toUpperCase()}${id.slice(1)}`),
      })),
    [t],
  );

  return (
    <div className="home-container">
      {showGuestLanding ? (
        <div className="home-landing">
          <h1 className="home-greeting">{t('home.greeting')}</h1>
          <h2 className="home-section-title">{t('home.popularSlides')}</h2>
        </div>
      ) : showLoggedInDashboard ? (
        <div className="home-dashboard">
          <h1 className="home-greeting">{t('home.greeting')}</h1>

          <section className="home-section">
            <h2 className="home-section-title">{t('home.recentSlides')}</h2>
            {isRecentLoading ? (
              <div className="home-status">{t('home.recentSlidesLoading')}</div>
            ) : recentError ? (
              <div className="home-create-error" role="alert">{recentError}</div>
            ) : recentSlides.length > 0 ? (
              <div className="home-grid">
                {recentSlides.map((slide) => (
                  <SlideCard
                    key={slide.id}
                    template={slide.template}
                    title={slide.title}
                    firstSlide={slide.firstSlide}
                    image={slide.image}
                    date={slide.date}
                    slides={slide.slides}
                    views={slide.views}
                    t={t}
                    onOpenTemplate={(template) => onOpenRecentTemplate?.(template.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="home-status">{t('home.recentSlidesEmpty')}</div>
            )}
          </section>

          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">{t('home.recommendedTemplates')}</h2>
              <button
                type="button"
                className="home-create-btn"
                onClick={onCreateNewSlide}
                disabled={isCreatingSlide}
              >
                <span className="home-create-btn__label">
                  {isCreatingSlide ? t('home.createNewSlideLoading') : t('home.createNewSlide')}
                </span>
                <span className="home-create-btn__hint">{t('home.createNewSlideHint')}</span>
              </button>
            </div>
            {createSlideError && (
              <div className="home-create-error" role="alert">
                {createSlideError}
              </div>
            )}
            <div className="home-grid">
              {recommendedTemplates.map((template) => (
                <SlideCard
                  key={template.id}
                  template={template}
                  title={template.title}
                  image={template.image}
                  date={template.date}
                  slides={template.slides}
                  views={template.views}
                  t={t}
                  onOpenTemplate={onOpenTemplate}
                />
              ))}
            </div>
          </section>
        </div>
      ) : showLibraryHeader ? (
        <div className="home-header">
          <div className="home-header-left">
            <h1 className="home-title">{t('home.templateTitle')}</h1>
            <h2 className="home-subtitle">{t('home.templateSubtitle')}</h2>
          </div>

          <div className="home-header-right">
            <div className="home-sort-group" role="group" aria-label={t('home.sortAria')}>
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`sort-btn${activeSort === option.id ? ' active' : ''}`}
                  onClick={() => setActiveSort(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="home-count">{t('home.resultCount', { count: templates.length })}</div>
          </div>
        </div>
      ) : null}

      {!showLoggedInDashboard && (
        <div className="home-grid">
          {templates.map((template) => (
            <SlideCard
              key={template.id}
              template={template}
              title={template.title}
              image={template.image}
              date={template.date}
              slides={template.slides}
              views={template.views}
              t={t}
              onOpenTemplate={onOpenTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
