'use client';

import React from 'react';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';

export function ComponentBrowser() {
  const { 
    components, 
    categories, 
    searchQuery, 
    selectedCategoryId,
    activeComponentId,
    setSearchQuery,
    setSelectedCategory,
    activateComponent,
    getFilteredComponents
  } = useComponentLibraryStoreV2();

  const filteredComponents = getFilteredComponents();

  return (
    <div className="component-browser">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="category-tree">
        <button
          className={!selectedCategoryId ? 'active' : ''}
          onClick={() => setSelectedCategory(null)}
        >
          All Components
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={selectedCategoryId === category.id ? 'active' : ''}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="component-grid">
        {filteredComponents.map((component) => (
          <div
            key={component.id}
            className={`component-card ${activeComponentId === component.id ? 'active' : ''}`}
            onClick={() => activateComponent(component.id)}
          >
            <h4>{component.name}</h4>
            <span className="type">{component.type}</span>
            {component.manufacturer && (
              <span className="manufacturer">{component.manufacturer}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
