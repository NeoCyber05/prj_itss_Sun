import React from 'react';
import './Home.css';

const mockTemplates = [
  {
    id: 1,
    title: '数学レポート：3次方程式のグラフ',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/10',
    slides: 12
  },
  {
    id: 2,
    title: '数学グループディスカッション：問',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80',
    date: '2023/12/10',
    slides: 15
  },
  {
    id: 3,
    title: '定理の証明フローと数理モデル設計',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/14',
    slides: 8
  },
  {
    id: 4,
    title: '数学試験結果報告：クラス別平均点',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/14',
    slides: 14
  },
  {
    id: 5,
    title: '幾何学入門：基本図形と体積公式',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    date: '2023/11/01',
    slides: 20
  },
  {
    id: 6,
    title: '代数学基礎演習：多項式と方程式',
    image: 'https://images.unsplash.com/photo-1632516643720-e7f0d0e1580e?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    slides: 18
  },
  {
    id: 7,
    title: '確率と統計の基礎：データ分析入門',
    image: 'https://images.unsplash.com/photo-1518133835878-5a93ac3fb206?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/18',
    slides: 10
  },
  {
    id: 8,
    title: '代数学基礎演習：多項式と方程式',
    image: 'https://images.unsplash.com/photo-1632516643720-e7f0d0e1580e?auto=format&fit=crop&w=400&q=80',
    date: '2023/10/22',
    slides: 18
  }
];

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-header">
        <div className="home-header-left">
          <h1 className="home-title">すうがくのテンプレート</h1>
          <h2 className="home-subtitle">SLIDEテンプレートライブラリ</h2>
        </div>
        <div className="home-header-right">
          <div className="home-sort-group">
            <button className="sort-btn active">名前順 ↑↓</button>
            <button className="sort-btn">作成日順 ↑↓</button>
            <button className="sort-btn">評価順 ↑↓</button>
            <button className="sort-btn">閲覧数順 ↑↓</button>
          </div>
          <div className="home-count">
            全{mockTemplates.length}件が見つかりました
          </div>
        </div>
      </div>

      <div className="home-grid">
        {mockTemplates.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-card-image">
              <img src={template.image} alt={template.title} />
            </div>
            <div className="template-card-content">
              <h3 className="template-card-title">{template.title}</h3>
              <div className="template-card-meta">
                <span className="template-date">最終更新: {template.date}</span>
                <span className="template-slides">{template.slides}スライド</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
