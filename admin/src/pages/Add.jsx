import React, { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { useFilters } from '../context/FilterContext'
import { FaCloudUploadAlt, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaPlus, FaTrash, FaImage, FaFilter } from 'react-icons/fa'

const token = localStorage.getItem('token');
console.log('token',token )
const Add = () => {
  const { filterOptions, getFilterValues, dynamicFilters, getGlobalFilters, getCategoryFilters, getApplicableFilters, filters } = useFilters();
console.log('token',token )

  console.log("Global filters:", getGlobalFilters())
  console.log("Filters:", filters)
  console.log("get filter values", getFilterValues())
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Image state
  const [images, setImages] = useState([null, null, null, null]);
  const [uploading, setUploading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [stepErrors, setStepErrors] = useState({});

  // Form state - now with dynamic filter values
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    subCategory: '',
    collection: '',
    bestseller: false,
    sizes: [],
    stock: {},
    hasSize: false,
    // Jewelry specifics
    sku: '',
    metalType: '',
    metalPurity: '',
    metalWeight: '',
    stoneType: '',
    stoneWeight: '',
    makingCharges: '',
    hallmark: true,
    certification: '',
    dimensions: { length: '', width: '', height: '' },
    // Dynamic object to store all filter values
    filterValues: {}
  });

  // Validation state
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: 'Product Images', icon: FaImage },
    { id: 2, title: 'Basic Details', icon: FaInfoCircle },
    { id: 3, title: 'Categories & Filters', icon: FaPlus },
    { id: 4, title: 'Stock & Pricing', icon: FaCheck }
  ];

  // Image validation
  const validateImage = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid format. Use JPEG, PNG, or WebP' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Max 5MB' };
    }
    return { valid: true, error: '' };
  };

  // Handle image upload
  const handleImageUpload = (file, index) => {
    const validation = validateImage(file);
    if (validation.valid) {
      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = file;
        return newImages;
      });
      setImageErrors(prev => ({ ...prev, [index]: '' }));
    } else {
      setImageErrors(prev => ({ ...prev, [index]: validation.error }));
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0], index);
    }
  }, []);

  // Remove image
  const removeImage = (index) => {
    setImages(prev => {
      const newImages = [...prev];
      // revoke object URL not strictly necessary here but could be added if using createObjectURL elsewhere
      newImages[index] = null;
      return newImages;
    });
    setImageErrors(prev => ({ ...prev, [index]: '' }));
  };

  // Form validation - step-focused
  const validateStep = (step, currentErrors = {}) => {
    // Compute only step-specific errors
    const stepErrors = {};

    switch (step) {
      case 1: {
        if (!images.some(img => img !== null)) {
          stepErrors.images = 'At least one image is required';
        }
        break;
      }
      case 2: {
        if (!formData.name || !formData.name.trim()) stepErrors.name = 'Product name is required';
        if (!formData.description || !formData.description.trim()) stepErrors.description = 'Description is required';
        break;
      }
      case 3: {
        if (!formData.category) stepErrors.category = 'Category is required';
        break;
      }
      case 4: {
        const priceValue = parseFloat(formData.price);
        if (isNaN(priceValue) || priceValue <= 0) {
          stepErrors.price = 'Valid price is required';
        }
        if (formData.hasSize && (!formData.sizes || formData.sizes.length === 0)) {
          stepErrors.sizes = 'Select at least one size';
        }
        break;
      }
      default:
        break;
    }

    // Merge stepErrors into a copy of currentErrors for display
    const mergedErrors = { ...currentErrors };

    // Remove any previous keys relevant to this step so display uses current stepErrors
    if (step === 1) {
      delete mergedErrors.images;
    } else if (step === 2) {
      delete mergedErrors.name;
      delete mergedErrors.description;
    } else if (step === 3) {
      delete mergedErrors.category;
    } else if (step === 4) {
      delete mergedErrors.price;
      delete mergedErrors.sizes;
    }

    // Add the stepErrors
    Object.assign(mergedErrors, stepErrors);

    // isValid refers only to this step's errors (so other steps' errors don't block advancing)
    const isValid = Object.keys(stepErrors).length === 0;

    return { isValid, errors: mergedErrors };
  };


  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Jewelry categories (static for now)
  const getAvailableCategories = () => {
    return [
      "Rings",
      "Necklaces",
      "Earrings",
      "Bracelets",
      "Bangles",
      "Pendants",
      "Nose Pins",
      "Anklets",
      "Sets"
    ];
  };

  // Get filter options with fallbacks
  const getFilterOptions = (filterName) => {
    const filterValues = getFilterValues ? getFilterValues(filterName) : [];
    if (Array.isArray(filterValues) && filterValues.length > 0) {
      return filterValues;
    }
    return (filterOptions && filterOptions[filterName]) || [];
  };

  // Get filters that should be shown for the current product
  const getAvailableFilters = () => {
    let availableFilters = [];

    if (!formData.category) {
      // If no category selected, show only global filters
      availableFilters = typeof getGlobalFilters === 'function' ? getGlobalFilters() : [];
    } else {
      // Show global + category-specific filters for the selected category
      availableFilters = typeof getApplicableFilters === 'function'
        ? getApplicableFilters(formData.category)
        : [];
    }

    // Filter out redundant filters that are handled elsewhere in the form
    const excludedFilters = ['gender', 'size']; // Gender is selected above, Size is in Step 4

    return (Array.isArray(availableFilters) ? availableFilters : [])
      .filter(filter => {
        if (!filter || !filter.name) return false;
        const nameLower = String(filter.name).toLowerCase();
        if (excludedFilters.includes(nameLower)) return false;
        // If values is an array of objects with isActive flag:
        if (Array.isArray(filter.values) && filter.values.length > 0) {
          const first = filter.values[0];
          if (typeof first === 'object' && first !== null && 'isActive' in first) {
            return filter.values.some(v => v && v.isActive);
          }
          // If values are simple strings, show them
          return true;
        }
        return false;
      });
  };

  // Handle dynamic filter value changes
  const handleFilterValueChange = (filterName, value, isMultiSelect = true) => {
    if (isMultiSelect) {
      const currentValues = formData.filterValues[filterName] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      setFormData(prev => ({
        ...prev,
        filterValues: {
          ...prev.filterValues,
          [filterName]: newValues
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        filterValues: {
          ...prev.filterValues,
          [filterName]: value
        }
      }));
    }
  };

  // Handle step navigation
  const nextStep = () => {
    // Validate only if leaving a step *before* Step 4
    if (currentStep < totalSteps) {
      const { isValid, errors: newErrors } = validateStep(currentStep, {});

      setErrors(newErrors);

      if (!isValid) {
        const firstMsg = Object.values(newErrors)[0] || "Please fix validation errors before continuing";
        toast.error(firstMsg);
        return false; // stop, don't advance
      }
    }

    // Clear errors when moving forward
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    return true;
  };

  useEffect(() => {
    console.log("My Current step is", currentStep)
  }, [currentStep])

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const onSubmitHandler = async (e) => {
    console.log("onsubmit handler triggerred")
    if (currentStep !== totalSteps) {
      return; // Ignore accidental submits before last step
    }
    e.preventDefault();

    // Validate *all steps* when submitting
    let allValid = true;
    let currentErrors = {};

    for (let i = 1; i <= totalSteps; i++) {
      const { isValid, errors: stepErrors } = validateStep(i, currentErrors);
      currentErrors = stepErrors;
      if (!isValid) {
        allValid = false;
      }
    }

    setErrors(currentErrors);

    if (!allValid) {
      const firstMsg = Object.values(currentErrors)[0] || "Please fix all validation errors before submitting";
      toast.error(firstMsg);
      return; // stop execution here
    }

    if (!token) {
      toast.error("You are not authenticated. Please login.");
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields (ensure strings for formData)
      formDataToSend.append("name", String(formData.name).trim());
      formDataToSend.append("description", String(formData.description).trim());
      formDataToSend.append("price", String(parseFloat(formData.price) || 0));
      formDataToSend.append("category", String(formData.category));
      formDataToSend.append("subCategory", String(formData.subCategory || ''));
      formDataToSend.append("collection", String(formData.collection || ''));
      formDataToSend.append("bestseller", String(Boolean(formData.bestseller)));
      formDataToSend.append("hasSize", String(Boolean(formData.hasSize)));
      formDataToSend.append("sizes", JSON.stringify(formData.hasSize ? formData.sizes : []));

      // Jewelry specific fields
      formDataToSend.append("sku", String(formData.sku || ''));
      formDataToSend.append("metalType", String(formData.metalType || ''));
      formDataToSend.append("metalPurity", String(formData.metalPurity || ''));
      formDataToSend.append("metalWeight", String(formData.metalWeight || ''));
      formDataToSend.append("stoneType", String(formData.stoneType || ''));
      formDataToSend.append("stoneWeight", String(formData.stoneWeight || ''));
      formDataToSend.append("makingCharges", String(formData.makingCharges || ''));
      formDataToSend.append("hallmark", String(Boolean(formData.hallmark)));
      formDataToSend.append("certification", String(formData.certification || ''));
      formDataToSend.append("dimensions", JSON.stringify(formData.dimensions || { length: 0, width: 0, height: 0 }));

      // Add all filter values as a combined filters object
      const allFilterValues = { ...(formData.filterValues || {}) };
      formDataToSend.append("filters", JSON.stringify(allFilterValues));

      // Normalize stock
      let normalizedStock = {};
      if (formData.hasSize) {
        (formData.sizes || []).forEach((size) => {
          const val = formData.stock?.[size];
          const parsed = (val === '' || val === undefined || val === null) ? 0 : parseInt(val, 10);
          normalizedStock[size] = Number.isNaN(parsed) ? 0 : parsed;
        });
      } else {
        const v = formData.stock?.value;
        const parsed = (v === '' || v === undefined || v === null) ? 0 : parseInt(v, 10);
        normalizedStock = { value: Number.isNaN(parsed) ? 0 : parsed };
      }

      formDataToSend.append("stock", JSON.stringify(normalizedStock));

      // Add images
      images.forEach((image, index) => {
        if (image) {
          formDataToSend.append(`image${index + 1}`, image);
        }
      });

      // Build URL safely

      const response = await axios.post(backendUrl.join("/product/add"), formDataToSend, {
        headers: { token }
      });

      if (response?.data?.success) {
        toast.success(response.data.message || "Product created successfully");

        // Reset form
        setFormData({
          name: '',
          description: '',
          price: 0,
          category: '',
          subCategory: '',
          collection: '',
          bestseller: false,
          sizes: [],
          stock: {},
          hasSize: false,
          sku: '',
          metalType: '',
          metalPurity: '',
          metalWeight: '',
          stoneType: '',
          stoneWeight: '',
          makingCharges: '',
          hallmark: true,
          certification: '',
          dimensions: { length: '', width: '', height: '' },
          filterValues: {}
        });
        setImages([null, null, null, null]);
        setImageErrors({});
        setErrors({});
        setCurrentStep(1);
      } else {
        toast.error(response?.data?.message || "Failed to add product");
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  // Render step content (unchanged UI, only logic above modified)
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Product Images</h3>
              <p className="text-gray-600">Add up to 4 high-quality images of your product</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative group ${dragActive ? 'scale-105' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className={`w-full h-40 border-2 border-dashed rounded-xl transition-all duration-300 ${image
                    ? 'border-green-400 bg-green-50'
                    : dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                    }`}>
                    {image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <FaTimes />
                        </button>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], index)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                          {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">Click or drag</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], index)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {imageErrors[index] && (
                    <p className="text-xs text-red-500 mt-2 flex items-center">
                      <FaExclamationTriangle className="mr-1" />
                      {imageErrors[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Image Guidelines</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use high-resolution images (minimum 800x800px)</li>
                <li>• Supported formats: JPEG, PNG, WebP</li>
                <li>• Maximum file size: 5MB per image</li>
                <li>• First image will be the main product display</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Basic Product Information</h3>
              <p className="text-gray-600">Tell customers about your product</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product features, materials, and benefits"
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${errors.description
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    }`}
                />
              </div>

              {/* Jewelry specific fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input type="text" value={formData.sku} onChange={e => handleInputChange('sku', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Optional SKU" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
                <input type="text" value={formData.collection} onChange={e => handleInputChange('collection', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., Bridal, Daily Wear" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metal Type</label>
                <input type="text" value={formData.metalType} onChange={e => handleInputChange('metalType', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Gold, Silver, Platinum" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metal Purity</label>
                <input type="text" value={formData.metalPurity} onChange={e => handleInputChange('metalPurity', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="22K, 18K, 925" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metal Weight (grams)</label>
                <input type="number" value={formData.metalWeight} onChange={e => handleInputChange('metalWeight', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., 7.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stone Type</label>
                <input type="text" value={formData.stoneType} onChange={e => handleInputChange('stoneType', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Diamond, CZ, Ruby" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stone Weight (carats)</label>
                <input type="number" value={formData.stoneWeight} onChange={e => handleInputChange('stoneWeight', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., 0.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Making Charges (₹)</label>
                <input type="number" value={formData.makingCharges} onChange={e => handleInputChange('makingCharges', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., 1200" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={formData.hallmark} onChange={e => handleInputChange('hallmark', e.target.checked)} />
                <label className="text-sm font-medium text-gray-700">Hallmark Certified</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Certification</label>
                <input type="text" value={formData.certification} onChange={e => handleInputChange('certification', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., IGI, SGL" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Length (mm)</label>
                  <input type="number" value={formData.dimensions.length} onChange={e => handleInputChange('dimensions', { ...formData.dimensions, length: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width (mm)</label>
                  <input type="number" value={formData.dimensions.width} onChange={e => handleInputChange('dimensions', { ...formData.dimensions, width: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (mm)</label>
                  <input type="number" value={formData.dimensions.height} onChange={e => handleInputChange('dimensions', { ...formData.dimensions, height: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                </div>
              </div>

            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Categories & Filters</h3>
              <p className="text-gray-600">Organize your product for better discoverability</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    handleInputChange('category', e.target.value);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.category
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    }`}
                >
                  <option value="">Select Category</option>
                  {getAvailableCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg px-4 py-3 hover:from-yellow-100 hover:to-orange-100 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.bestseller}
                    onChange={(e) => handleInputChange('bestseller', e.target.checked)}
                    className="mr-3 w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Bestseller</span>
                </label>
              </div>
            </div>

            {/* Dynamic Product Filters */}
            <div className="space-y-6">
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Product Attributes</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Select the attributes that describe this product. These help customers find and filter products.
                </p>

                {getAvailableFilters().length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {getAvailableFilters()
                      .sort((a, b) => {
                        // Priority order for better UX
                        const priority = {
                          'color': 1,
                          'material': 2,
                          'occasion': 3,
                          'type': 4
                        };
                        return (priority[a.name.toLowerCase()] || 99) - (priority[b.name.toLowerCase()] || 99);
                      })
                      .map((filter) => (
                        <div key={filter._id} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 text-base mb-1">
                              {filter.displayName}
                            </h5>
                            {filter.description && (
                              <p className="text-xs text-gray-500">{filter.description}</p>
                            )}
                          </div>

                          {filter.filterType === 'single-select' ? (
                            // Radio buttons for single select
                            <div className="grid grid-cols-2 gap-3">
                              {Array.isArray(filter.values) ? filter.values.filter(v => !v || v.isActive === undefined || v.isActive).map((item) => {
                                const value = (item && item.value) || item;
                                const display = (item && item.displayName) || String(item);
                                return (
                                  <label key={value} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                                    <input
                                      type="radio"
                                      name={filter.name}
                                      checked={formData.filterValues[filter.name] === value}
                                      onChange={() => handleFilterValueChange(filter.name, value, false)}
                                      className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 flex items-center gap-2">
                                      {item && item.colorCode && (
                                        <span
                                          className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
                                          style={{ backgroundColor: item.colorCode }}
                                        />
                                      )}
                                      {display}
                                    </span>
                                  </label>
                                );
                              }) : null}
                            </div>
                          ) : filter.filterType === 'multi-select' ? (
                            // Checkboxes for multi select
                            <div className="grid grid-cols-2 gap-3">
                              {Array.isArray(filter.values) ? filter.values.filter(v => !v || v.isActive === undefined || v.isActive).map((item) => {
                                const value = (item && item.value) || item;
                                const display = (item && item.displayName) || String(item);
                                return (
                                  <label key={value} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={(formData.filterValues[filter.name] || []).includes(value)}
                                      onChange={() => handleFilterValueChange(filter.name, value, true)}
                                      className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 flex items-center gap-2">
                                      {item && item.colorCode && (
                                        <span
                                          className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
                                          style={{ backgroundColor: item.colorCode }}
                                        />
                                      )}
                                      {display}
                                    </span>
                                  </label>
                                );
                              }) : null}
                            </div>
                          ) : (
                            // Range input (for future use)
                            <div className="text-sm text-gray-500 italic bg-white p-3 rounded border">
                              Range filters are not implemented yet
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FaFilter className="text-5xl text-gray-300 mx-auto mb-3" />
                    <h5 className="text-lg font-medium text-gray-700 mb-2">No product attributes available</h5>
                    <p className="text-sm text-gray-500 mb-4">
                      {!formData.category
                        ? "Select a category above to see available product attributes"
                        : "No attributes are configured for this category"
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      Add filters in Filter Management to enable product attributes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Stock & Pricing</h3>
              <p className="text-gray-600">Set your product pricing and inventory</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('price', value === '' ? 0 : parseInt(value, 10));
                  }}
                  placeholder="0"
                  min="1"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.price
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    }`}
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-2 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {errors.price}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-100 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.hasSize}
                    onChange={(e) => {
                      handleInputChange('hasSize', e.target.checked);
                      handleInputChange('sizes', []);
                      handleInputChange('stock', {});
                    }}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Product has sizes</span>
                </label>
              </div>
            </div>

            {formData.hasSize ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Sizes <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {getFilterOptions('size').map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const newSizes = formData.sizes.includes(size)
                            ? formData.sizes.filter((s) => s !== size)
                            : [...formData.sizes, size];
                          handleInputChange('sizes', newSizes);

                          if (!newSizes.includes(size)) {
                            const newStock = { ...formData.stock };
                            delete newStock[size];
                            handleInputChange('stock', newStock);
                          }
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${formData.sizes.includes(size)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                          }`}
                      >
                        {size}
                      </button>
                    ))}

                  </div>
                </div>

                {formData.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Stock per Size</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.sizes.map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <span className="w-14 text-sm font-medium text-gray-700">{size}:</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={
                              formData.stock[size] === undefined || formData.stock[size] === 0
                                ? ''
                                : formData.stock[size]
                            }
                            onChange={(e) =>
                              handleInputChange('stock', {
                                ...formData.stock,
                                [size]: e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                              })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={formData.stock?.value === 0 ? '' : (formData.stock?.value ?? '')}
                  onChange={(e) =>
                    handleInputChange('stock', {
                      value: e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                    })
                  }
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        );

      default:
        return <div>Step content will be added</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
        <p className="text-gray-600 mt-1">Create a new product listing for your store</p>
      </div>

      {/* Progress Steps */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep >= step.id
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-500'
                }`}>
                {currentStep > step.id ? (
                  <FaCheck className="text-sm" />
                ) : (
                  <step.icon className="text-sm" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {/* Step Content */}
      <div className="p-6">
        {renderStepContent()}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          {/* Previous Button */}
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>

          {/* Next / Submit Button */}
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmitHandler} // Only runs when clicked
              disabled={uploading}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Product...
                </div>
              ) : (
                'Create Product'
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default Add;
