import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FilterPanel = ({ backendUrl, onFilterChange, selectedCategory, selectedFilters }) => {
  const [managedFilters, setManagedFilters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagedFilters();
  }, []);

  const fetchManagedFilters = async () => {
    try {
      // Get filters from Filter Management system
      const response = await axios.get(`${backendUrl}/filter`);
      if (response.data.success) {
        setManagedFilters(response.data.filters);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching managed filters:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value, isChecked) => {
    const newFilters = { ...selectedFilters };
    
    // Get filter configuration to check if it's single or multi-select
    const filter = managedFilters.find(f => f.name === filterName);
    const isMultiSelect = filter?.filterType !== 'single-select';

    if (isMultiSelect) {
      // Multi-select: use arrays
      if (!newFilters[filterName]) {
        newFilters[filterName] = [];
      }
      
      if (isChecked) {
        if (!newFilters[filterName].includes(value)) {
          newFilters[filterName] = [...newFilters[filterName], value];
        }
      } else {
        newFilters[filterName] = newFilters[filterName].filter(item => item !== value);
      }
    } else {
      // Single-select: use single value
      if (isChecked) {
        newFilters[filterName] = [value]; // Keep as array for consistency with backend
      } else {
        newFilters[filterName] = [];
      }
    }

    onFilterChange(newFilters);
  };

  const getApplicableFilters = () => {
    if (!selectedFilters.category || selectedFilters.category.length === 0) {
      // No category selected, show only global filters
      return managedFilters.filter(filter => filter.type === 'global');
    }
    
    // Show global + category-specific filters for selected categories
    return managedFilters.filter(filter => {
      if (filter.type === 'global') return true;
      if (filter.type === 'category-specific') {
        return selectedFilters.category.some(cat => 
          filter.applicableCategories.includes(cat.charAt(0).toUpperCase() + cat.slice(1))
        );
      }
      return false;
    });
  };

  const renderFilterSection = (filter) => {
    const activeValues = filter.values.filter(v => v.isActive);
    
    if (activeValues.length === 0) return null;

    return (
      <div key={filter._id} className="bg-white rounded-2xl p-4 shadow-soft border border-gray-50 hover:shadow-medium transition-all duration-300">
        <h4 className="font-semibold mb-4 text-gray-800 text-base flex items-center gap-2">
          {filter.displayName}
          <span className="text-xs bg-hotpink-100 text-hotpink-600 px-2 py-1 rounded-full font-medium">
            {activeValues.length}
          </span>
        </h4>
        {filter.description && (
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">{filter.description}</p>
        )}
        
        <div className="space-y-3">
          {activeValues.map(value => {
            const isSelected = selectedFilters[filter.name]?.includes(value.value) || false;
            
            return (
              <label key={value.value} className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type={filter.filterType === 'single-select' ? 'radio' : 'checkbox'}
                    name={filter.filterType === 'single-select' ? filter.name : undefined}
                    checked={isSelected}
                    onChange={(e) => handleFilterChange(filter.name, value.value, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-gradient-to-r from-hotpink-400 to-hotpink-600 border-hotpink-500 shadow-soft' 
                      : 'border-gray-200 group-hover:border-hotpink-300 bg-white'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700 flex items-center gap-2 group-hover:text-hotpink-600 transition-colors duration-300">
                  {value.colorCode && (
                    <span 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-soft ring-1 ring-gray-200"
                      style={{ backgroundColor: value.colorCode }}
                    />
                  )}
                  <span className="font-medium">{value.displayName}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-80 p-6 bg-white rounded-2xl shadow-soft border border-gray-50">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded-xl"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const applicableFilters = getApplicableFilters();

  return (
    <div className="w-80 p-6 bg-white rounded-2xl shadow-soft border border-gray-50 h-fit sticky top-24">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-hotpink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Filters
        </h3>
        
        {/* Clear All Filters */}
        <button
          onClick={() => onFilterChange({
            gender: [],
            occasion: [],
            type: [],
            category: [],
            color: [],
            material: [],
            size: []
          })}
          className="text-sm text-hotpink-600 hover:text-hotpink-800 font-medium flex items-center gap-1 hover:bg-hotpink-50 px-3 py-1.5 rounded-lg transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All
        </button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Category Filter - Always show first */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-50 hover:shadow-medium transition-all duration-300">
          <h4 className="font-semibold mb-4 text-gray-800 text-base flex items-center gap-2">
            Category
            <span className="text-xs bg-hotpink-100 text-hotpink-600 px-2 py-1 rounded-full font-medium">
              7
            </span>
          </h4>
          <div className="space-y-3">
            {['Sarees', 'Kurtis', 'Suits', 'Shirts', 'Pants', 'Dress', 'Salwars', "Sets"].map(category => (
              <label key={category} className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.category?.includes(category.toLowerCase()) || false}
                    onChange={(e) => handleFilterChange('category', category.toLowerCase(), e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                    selectedFilters.category?.includes(category.toLowerCase()) 
                      ? 'bg-gradient-to-r from-hotpink-400 to-hotpink-600 border-hotpink-500 shadow-soft' 
                      : 'border-gray-200 group-hover:border-hotpink-300 bg-white'
                  }`}>
                    {selectedFilters.category?.includes(category.toLowerCase()) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700 font-medium group-hover:text-hotpink-600 transition-colors duration-300">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Filter - Always show */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-50 hover:shadow-medium transition-all duration-300">
          <h4 className="font-semibold mb-4 text-gray-800 text-base flex items-center gap-2">
            Gender
            <span className="text-xs bg-hotpink-100 text-hotpink-600 px-2 py-1 rounded-full font-medium">
              3
            </span>
          </h4>
          <div className="space-y-3">
            {['Women', 'Men', 'Children'].map(gender => (
              <label key={gender} className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.gender?.includes(gender.toLowerCase()) || false}
                    onChange={(e) => handleFilterChange('gender', gender.toLowerCase(), e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                    selectedFilters.gender?.includes(gender.toLowerCase()) 
                      ? 'bg-gradient-to-r from-hotpink-400 to-hotpink-600 border-hotpink-500 shadow-soft' 
                      : 'border-gray-200 group-hover:border-hotpink-300 bg-white'
                  }`}>
                    {selectedFilters.gender?.includes(gender.toLowerCase()) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700 font-medium group-hover:text-hotpink-600 transition-colors duration-300">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dynamic Managed Filters */}
        {applicableFilters
          .filter(filter => !['gender', 'category'].includes(filter.name.toLowerCase())) // Exclude handled above
          .sort((a, b) => {
            // Priority order for better UX
            const priority = {
              'color': 1,
              'material': 2,
              'occasion': 3,
              'type': 4,
              'size': 5
            };
            return (priority[a.name.toLowerCase()] || 99) - (priority[b.name.toLowerCase()] || 99);
          })
          .map(filter => renderFilterSection(filter))}

        {applicableFilters.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <p className="text-gray-500 text-sm font-medium">No filters available</p>
            <p className="text-gray-400 text-xs mt-1">
              {selectedFilters.category?.length > 0 
                ? "No filters configured for this category"
                : "Select a category to see filters"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;