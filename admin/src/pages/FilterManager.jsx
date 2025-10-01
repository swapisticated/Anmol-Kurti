import React, { useState, useMemo } from 'react';
import { useFilters } from '../context/FilterContext';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaFilter, FaEye, FaCog, FaTag, FaSearch, FaGlobe, FaLayerGroup, FaCheckCircle, FaTimesCircle, FaPalette, FaSort } from 'react-icons/fa';

const FilterManager = () => {
  const { 
    filters, 
    dynamicFilters, 
    loading, 
    addFilter, 
    updateFilter, 
    deleteFilter,
    initializeDefaultFilters
  } = useFilters();
  
  const [activeTab, setActiveTab] = useState('manage');
  const [editingFilter, setEditingFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'global', 'category-specific'
  
  const [newFilter, setNewFilter] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'global',
    filterType: 'multi-select',
    values: [],
    applicableCategories: [],
    sortOrder: 0
  });
  
  const [newValue, setNewValue] = useState({ value: '', displayName: '', colorCode: '' });
  const [showValueInput, setShowValueInput] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);

  const filterTypes = [
    { value: 'global', label: 'Global', icon: FaGlobe, desc: 'Apply to all products' },
    { value: 'category-specific', label: 'Category Specific', icon: FaLayerGroup, desc: 'Apply to selected categories' }
  ];

  const inputTypes = [
    { value: 'single-select', label: 'Single Select', desc: 'Radio buttons - one choice' },
    { value: 'multi-select', label: 'Multi Select', desc: 'Checkboxes - multiple choices' },
    { value: 'range', label: 'Range', desc: 'Slider or input range' }
  ];

  const productCategories = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles', 'Pendants', 'Nose Pins', 'Anklets', 'Sets'];

  // Filter and search logic
  const filteredFilters = useMemo(() => {
    let result = filters;
    
    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(filter => filter.type === filterType);
    }
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(filter => 
        filter.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result;
  }, [filters, filterType, searchTerm]);

  const handleAddFilter = async () => {
    if (!newFilter.name || !newFilter.displayName || newFilter.values.length === 0) {
      return false;
    }

    const success = await addFilter(newFilter);
    if (success) {
      setNewFilter({
        name: '',
        displayName: '',
        description: '',
        type: 'global',
        filterType: 'multi-select',
        values: [],
        applicableCategories: [],
        sortOrder: 0
      });
      setShowValueInput(false);
      setShowAddFilter(false);
    }
  };

  const handleUpdateFilter = async () => {
    if (!editingFilter || editingFilter.values.length === 0) {
      return false;
    }

    const success = await updateFilter(editingFilter._id, {
      displayName: editingFilter.displayName,
      description: editingFilter.description,
      values: editingFilter.values,
      applicableCategories: editingFilter.applicableCategories,
      sortOrder: editingFilter.sortOrder
    });
    if (success) {
      setEditingFilter(null);
    }
  };

  const handleDeleteFilter = async (filterId) => {
    if (!window.confirm('Are you sure you want to delete this filter? This action cannot be undone.')) return;
    await deleteFilter(filterId);
  };

  const addValueToNewFilter = () => {
    if (newValue.value.trim() && newValue.displayName.trim()) {
      const valueExists = newFilter.values.some(v => v.value === newValue.value.trim());
      if (!valueExists) {
        setNewFilter(prev => ({
          ...prev,
          values: [...prev.values, {
            value: newValue.value.trim(),
            displayName: newValue.displayName.trim(),
            colorCode: newValue.colorCode || undefined,
            isActive: true
          }]
        }));
        setNewValue({ value: '', displayName: '', colorCode: '' });
      }
    }
  };

  const removeValueFromNewFilter = (valueToRemove) => {
    setNewFilter(prev => ({
      ...prev,
      values: prev.values.filter(v => v.value !== valueToRemove)
    }));
  };

  const addValueToEditingFilter = () => {
    if (newValue.value.trim() && newValue.displayName.trim()) {
      const valueExists = editingFilter.values.some(v => v.value === newValue.value.trim());
      if (!valueExists) {
        setEditingFilter(prev => ({
          ...prev,
          values: [...prev.values, {
            value: newValue.value.trim(),
            displayName: newValue.displayName.trim(),
            colorCode: newValue.colorCode || undefined,
            isActive: true
          }]
        }));
        setNewValue({ value: '', displayName: '', colorCode: '' });
      }
    }
  };

  const removeValueFromEditingFilter = (valueToRemove) => {
    setEditingFilter(prev => ({
      ...prev,
      values: prev.values.filter(v => v.value !== valueToRemove)
    }));
  };

  const toggleValueActive = (filterId, valueIndex) => {
    if (editingFilter && editingFilter._id === filterId) {
      setEditingFilter(prev => ({
        ...prev,
        values: prev.values.map((value, index) => 
          index === valueIndex ? { ...value, isActive: !value.isActive } : value
        )
      }));
    }
  };

  const resetNewFilter = () => {
    setNewFilter({
      name: '',
      displayName: '',
      description: '',
      type: 'global',
      filterType: 'multi-select',
      values: [],
      applicableCategories: [],
      sortOrder: 0
    });
    setNewValue({ value: '', displayName: '', colorCode: '' });
    setShowValueInput(false);
    setShowAddFilter(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Filter Management</h2>
              <p className="text-gray-600">Create and manage product filters for your e-commerce platform</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'manage'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaCog className="text-sm" />
                Manage Filters
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaEye className="text-sm" />
                Dynamic Filters
              </button>
              <button
                onClick={initializeDefaultFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-200"
                title="Initialize default industry-standard filters"
              >
                <FaSave className="text-sm" />
                Initialize Defaults
              </button>
            </div>
          </div>

          {activeTab === 'manage' && (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search filters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="global">Global Filters</option>
                <option value="category-specific">Category Specific</option>
              </select>

              {/* Add Filter Button */}
          <button
                onClick={() => setShowAddFilter(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
                <FaPlus className="text-sm" />
                Add Filter
          </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Add New Filter Modal */}
          {showAddFilter && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">Create New Filter</h3>
                    <button
                      onClick={resetNewFilter}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter Name (Internal)</label>
                      <input
                        type="text"
                        value={newFilter.name}
                        onChange={(e) => setNewFilter(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        placeholder="e.g., color, size, material"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={newFilter.displayName}
                        onChange={(e) => setNewFilter(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="e.g., Color, Size, Material"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Filter Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filterTypes.map(type => (
                        <label
                          key={type.value}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                            newFilter.type === type.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="filterType"
                            value={type.value}
                            checked={newFilter.type === type.value}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, type: e.target.value }))}
                            className="sr-only"
                          />
                          <type.icon className={`text-xl mr-3 ${
                            newFilter.type === type.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className={`font-medium ${
                              newFilter.type === type.value ? 'text-blue-700' : 'text-gray-700'
                            }`}>{type.label}</p>
                            <p className="text-sm text-gray-500">{type.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Input Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Input Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {inputTypes.map(type => (
                        <label
                          key={type.value}
                          className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${
                            newFilter.filterType === type.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="inputType"
                            value={type.value}
                            checked={newFilter.filterType === type.value}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, filterType: e.target.value }))}
                            className="sr-only"
                          />
                          <p className={`font-medium mb-1 ${
                            newFilter.filterType === type.value ? 'text-blue-700' : 'text-gray-700'
                          }`}>{type.label}</p>
                          <p className="text-xs text-gray-500 text-center">{type.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea
                      value={newFilter.description}
                      onChange={(e) => setNewFilter(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this filter"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                  </div>

                  {/* Applicable Categories */}
                  {newFilter.type === 'category-specific' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Applicable Categories</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {productCategories.map(cat => (
                          <label key={cat} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newFilter.applicableCategories.includes(cat)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewFilter(prev => ({
                                    ...prev,
                                    applicableCategories: [...prev.applicableCategories, cat]
                                  }));
                                } else {
                                  setNewFilter(prev => ({
                                    ...prev,
                                    applicableCategories: prev.applicableCategories.filter(c => c !== cat)
                                  }));
                                }
                              }}
                              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter Values */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Filter Values</label>
                      <button
                        onClick={() => setShowValueInput(!showValueInput)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <FaPlus className="text-xs" />
                        Add Value
                      </button>
                    </div>

                    {showValueInput && (
                      <div className="bg-gray-50 rounded-lg border p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
                            value={newValue.value}
                            onChange={(e) => setNewValue(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="Value (e.g., red, large)"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
                            value={newValue.displayName}
                            onChange={(e) => setNewValue(prev => ({ ...prev, displayName: e.target.value }))}
                            placeholder="Display name (e.g., Red, Large)"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            {newFilter.name === 'color' && (
                              <input
                                type="color"
                                value={newValue.colorCode || '#000000'}
                                onChange={(e) => setNewValue(prev => ({ ...prev, colorCode: e.target.value }))}
                                className="w-12 h-10 border border-gray-300 rounded-lg"
                              />
                            )}
                            <button
                              onClick={addValueToNewFilter}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {newFilter.values.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newFilter.values.map((value, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {value.colorCode && (
                              <span 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: value.colorCode }}
                              />
                            )}
                            {value.displayName}
                            <button
                              onClick={() => removeValueFromNewFilter(value.value)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
      </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={resetNewFilter}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFilter}
                    disabled={!newFilter.name || !newFilter.displayName || newFilter.values.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Filter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters Grid */}
      <div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredFilters.length === 0 ? (
              <div className="text-center py-12">
                <FaFilter className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {filters.length === 0 ? 'No filters found' : 'No filters match your search'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {filters.length === 0 
                    ? 'Create your first filter to organize your products'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {filters.length === 0 && (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setShowAddFilter(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Filter
                    </button>
                    <button
                      onClick={initializeDefaultFilters}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Initialize Defaults
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFilters.map((filter) => (
                  <div key={filter._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">{filter.displayName}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            filter.type === 'global' 
                              ? 'bg-green-100 text-green-700 flex items-center gap-1' 
                              : 'bg-blue-100 text-blue-700 flex items-center gap-1'
                          }`}>
                            {filter.type === 'global' ? <FaGlobe className="text-xs" /> : <FaLayerGroup className="text-xs" />}
                            {filter.type === 'global' ? 'Global' : 'Category'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{filter.name}</p>
                        {filter.description && (
                          <p className="text-sm text-gray-500">{filter.description}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {editingFilter?._id === filter._id ? (
                          <>
                            <button
                              onClick={handleUpdateFilter}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Save changes"
                            >
                              <FaSave className="text-sm" />
                            </button>
                            <button
                              onClick={() => setEditingFilter(null)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Cancel editing"
                            >
                              <FaTimes className="text-sm" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                              onClick={() => setEditingFilter({ ...filter })}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Edit filter"
                            >
                              <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(filter._id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete filter"
                    >
                              <FaTrash className="text-sm" />
                    </button>
                  </>
                )}
              </div>
            </div>

                    {filter.type === 'category-specific' && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {filter.applicableCategories.map(cat => (
                            <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {editingFilter?._id === filter._id ? (
                      <div>
                        <div className="mb-3">
                          <button
                            onClick={() => setShowValueInput(!showValueInput)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm mb-2"
                          >
                            <FaPlus className="text-xs" />
                            Add Value
                          </button>
                          
                          {showValueInput && (
                            <div className="bg-gray-50 rounded-lg border p-3 mb-3">
                              <div className="grid grid-cols-1 gap-2">
                                <input
                                  type="text"
                                  value={newValue.value}
                                  onChange={(e) => setNewValue(prev => ({ ...prev, value: e.target.value }))}
                                  placeholder="Value"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
              <input
                type="text"
                                  value={newValue.displayName}
                                  onChange={(e) => setNewValue(prev => ({ ...prev, displayName: e.target.value }))}
                                  placeholder="Display name"
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={addValueToEditingFilter}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {editingFilter.values.map((value, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                value.isActive 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {value.colorCode && (
                                <span 
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: value.colorCode }}
                                />
                              )}
                              <button
                                onClick={() => toggleValueActive(filter._id, index)}
                                className="hover:underline"
                              >
                                {value.displayName}
                              </button>
                              <button
                                onClick={() => removeValueFromEditingFilter(value.value)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filter.values.slice(0, 6).map((value, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              value.isActive 
                                ? 'bg-gray-100 text-gray-700' 
                                : 'bg-red-50 text-red-600 line-through'
                            }`}
                          >
                            {value.colorCode && (
                              <span 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: value.colorCode }}
                              />
                            )}
                            {value.displayName}
                          </span>
                        ))}
                        {filter.values.length > 6 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{filter.values.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Dynamic Filters</h3>
              <p className="text-gray-600">
                These are the actual filter values extracted from your product catalog
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(dynamicFilters).map(([filterType, values]) => (
                <div key={filterType} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaTag className="text-blue-500" />
                    <span className="capitalize">{filterType.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(values) ? values.slice(0, 10).map((value, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm border shadow-sm"
                      >
                        {value}
                      </span>
                    )) : filterType === 'priceRange' ? (
                      <span className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm border shadow-sm">
                        ₹{values.minPrice} - ₹{values.maxPrice}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm italic">No values</span>
                    )}
                    {Array.isArray(values) && values.length > 10 && (
                      <span className="text-gray-500 text-sm bg-white px-2 py-1 rounded border">
                        +{values.length - 10} more
                      </span>
                    )}
                  </div>
          </div>
        ))}
      </div>

            {Object.keys(dynamicFilters).length === 0 && (
              <div className="text-center py-12">
                <FaFilter className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No dynamic filters available</h3>
                <p className="text-gray-500">Add some products to see dynamic filter values</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterManager;
