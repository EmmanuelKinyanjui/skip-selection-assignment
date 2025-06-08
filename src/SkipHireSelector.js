import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, Loader2, Filter, HelpCircle, Calendar, X } from 'lucide-react';

const SkipHireSelector = () => {
    const [selectedSkip, setSelectedSkip] = useState(null);
    const [skipSizes, setSkipSizes] = useState([]);
    const [filteredSkips, setFilteredSkips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRoadLegalOnly, setShowRoadLegalOnly] = useState(false);
    const [showHeavyWasteOnly, setShowHeavyWasteOnly] = useState(false);
    const [sortBy, setSortBy] = useState('size'); // 'size' or 'price'
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const fetchSkipData = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://app.wewantwaste.co.uk/api/skips/by-location?postcode=NR32&area=Lowestoft');

                if (!response.ok) {
                    throw new Error('Failed to fetch skip data');
                }

                const data = await response.json();

                // Transform API data to match our component structure
                const transformedData = data.map((skip, index) => {
                    const finalPrice = Math.round(skip.price_before_vat * (1 + skip.vat / 100));
                    const priceBeforeVat = skip.price_before_vat;
                    const vatAmount = Math.round(skip.price_before_vat * (skip.vat / 100));

                    // Determine capacity descriptions based on skip size
                    const getCapacityInfo = (size) => {
                        const capacityMap = {
                            4: { binBags: '30-35', description: 'Small bathroom renovation' },
                            6: { binBags: '45-50', description: 'Kitchen renovation' },
                            8: { binBags: '60-65', description: 'Large house clearance' },
                            10: { binBags: '75-80', description: 'Garden landscaping' },
                            12: { binBags: '90-95', description: 'Major renovation' },
                            14: { binBags: '105-110', description: 'Construction project' },
                            16: { binBags: '120-125', description: 'Large construction' },
                            20: { binBags: '150+', description: 'Commercial project' },
                            40: { binBags: '300+', description: 'Major commercial work' }
                        };
                        return capacityMap[size] || { binBags: 'N/A', description: 'Various projects' };
                    };

                    const capacityInfo = getCapacityInfo(skip.size);

                    return {
                        id: skip.id,
                        size: skip.size,
                        sizeLabel: `${skip.size} Yards`,
                        period: `${skip.hire_period_days} day hire period`,
                        hirePeriodDays: skip.hire_period_days,
                        price: `£${finalPrice}`,
                        priceNumeric: finalPrice,
                        priceBeforeVat: `£${priceBeforeVat}`,
                        vatAmount: `£${vatAmount}`,
                        vatRate: skip.vat,
                        transportCost: skip.transport_cost,
                        perTonneCost: skip.per_tonne_cost,
                        image: `https://yozbrydxdlcxghkphhtq.supabase.co/storage/v1/object/public/skips/skip-sizes/${skip.size}-yarder-skip.jpg`,
                        restrictions: [],
                        roadLegal: skip.allowed_on_road,
                        heavyWasteSuitable: skip.allows_heavy_waste,
                        capacityInfo
                    };
                });

                setSkipSizes(transformedData);
                setFilteredSkips(transformedData);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching skip data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSkipData();
    }, []);

    // Filter and sort skips when filters change
    useEffect(() => {
        let filtered = [...skipSizes];

        if (showRoadLegalOnly) {
            filtered = filtered.filter(skip => skip.roadLegal);
        }

        if (showHeavyWasteOnly) {
            filtered = filtered.filter(skip => skip.heavyWasteSuitable);
        }

        // Sort skips
        if (sortBy === 'price') {
            filtered.sort((a, b) => a.priceNumeric - b.priceNumeric);
        } else {
            filtered.sort((a, b) => a.size - b.size);
        }

        setFilteredSkips(filtered);
    }, [skipSizes, showRoadLegalOnly, showHeavyWasteOnly, sortBy]);

    const progressSteps = [
        { id: 1, label: 'Postcode', completed: true },
        { id: 2, label: 'Waste Type', completed: true },
        { id: 3, label: 'Select Skip', active: true },
        { id: 4, label: 'Permit Check', completed: false },
        { id: 5, label: 'Choose Date', completed: false },
        { id: 6, label: 'Payment', completed: false }
    ];

    const handleSkipSelect = (skipId) => {
        setSelectedSkip(skipId);
    };

    const renderPriceDetails = (skip) => {
        if (skip.transportCost && skip.perTonneCost) {
            return (
                <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">£{skip.transportCost}</div>
                    <div className="text-xs text-gray-500">+ £{skip.perTonneCost}/tonne</div>
                    <div className="text-xs text-gray-400">Transport + disposal</div>
                </div>
            );
        } else {
            return (
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{skip.price}</div>
                    <div className="text-xs text-gray-500">
                        {skip.priceBeforeVat} + {skip.vatAmount} VAT
                    </div>
                </div>
            );
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading skip options...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Failed to load skip options</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Help Modal Component
    const HelpModal = () => {
        if (!showHelp) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <HelpCircle className="w-6 h-6 text-blue-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Skip Size Guide</h2>
                        </div>
                        <button
                            onClick={() => setShowHelp(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6">
                        <p className="text-gray-600 mb-6">
                            Choose the right skip size for your project. Here's a guide to help you decide:
                        </p>

                        {/* Skip Size Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-lg">
                                <div className="text-green-800 font-bold text-lg mb-2">Small Projects</div>
                                <div className="text-green-700 font-medium mb-3">4-6 Yard Skips</div>
                                <ul className="text-green-600 text-sm space-y-1">
                                    <li>• Bathroom renovation</li>
                                    <li>• Small garden clearance</li>
                                    <li>• Decluttering rooms</li>
                                    <li>• Small DIY projects</li>
                                </ul>
                                <div className="mt-4 text-xs text-green-500">
                                    Equivalent to 30-50 bin bags
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-lg">
                                <div className="text-blue-800 font-bold text-lg mb-2">Medium Projects</div>
                                <div className="text-blue-700 font-medium mb-3">8-10 Yard Skips</div>
                                <ul className="text-blue-600 text-sm space-y-1">
                                    <li>• Kitchen renovation</li>
                                    <li>• House clearance</li>
                                    <li>• Garden landscaping</li>
                                    <li>• Garage clearout</li>
                                </ul>
                                <div className="mt-4 text-xs text-blue-500">
                                    Equivalent to 60-80 bin bags
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-6 rounded-lg">
                                <div className="text-purple-800 font-bold text-lg mb-2">Large Projects</div>
                                <div className="text-purple-700 font-medium mb-3">12+ Yard Skips</div>
                                <ul className="text-purple-600 text-sm space-y-1">
                                    <li>• Construction work</li>
                                    <li>• Major renovations</li>
                                    <li>• Commercial projects</li>
                                    <li>• Large clearances</li>
                                </ul>
                                <div className="mt-4 text-xs text-purple-500">
                                    Equivalent to 90+ bin bags
                                </div>
                            </div>
                        </div>

                        {/* Additional Tips */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <h3 className="font-semibold text-yellow-800 mb-3">💡 Pro Tips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
                                <div>
                                    <div className="font-medium mb-1">Not sure about size?</div>
                                    <div>It's often better to go one size larger than you think you need.</div>
                                </div>
                                <div>
                                    <div className="font-medium mb-1">Heavy materials?</div>
                                    <div>Soil, concrete, and bricks are heavy - choose a smaller skip.</div>
                                </div>
                                <div>
                                    <div className="font-medium mb-1">Road placement?</div>
                                    <div>Check if you need a permit for skips placed on public roads.</div>
                                </div>
                                <div>
                                    <div className="font-medium mb-1">Mixed waste?</div>
                                    <div>General household waste can be mixed, but some items are prohibited.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                        <button
                            onClick={() => setShowHelp(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Progress Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4 overflow-x-auto">
                        {progressSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-shrink-0">
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${step.completed
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : step.active
                                            ? 'border-blue-600 text-blue-600 bg-white'
                                            : 'border-gray-300 text-gray-500 bg-white'
                                        }`}>
                                        {step.completed ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium hidden sm:block ${step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < progressSteps.length - 1 && (
                                    <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step.completed ? 'bg-blue-600' : 'bg-gray-300'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Choose Your Skip Size
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
                        Select the skip size that best suits your needs
                    </p>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        <HelpCircle className="w-4 h-4 mr-1" />
                        Need help choosing?
                    </button>
                </div>


                {/* Filters and Sorting */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <Filter className="w-4 h-4 text-gray-500 mr-2" />
                                <span className="text-sm font-medium text-gray-700">Filters:</span>
                            </div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showRoadLegalOnly}
                                    onChange={(e) => setShowRoadLegalOnly(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Road legal only</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showHeavyWasteOnly}
                                    onChange={(e) => setShowHeavyWasteOnly(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Heavy waste suitable</span>
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="size">Size</option>
                                <option value="price">Price</option>
                            </select>
                        </div>
                    </div>
                    {(showRoadLegalOnly || showHeavyWasteOnly) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {filteredSkips.length} of {skipSizes.length} skips
                            </div>
                        </div>
                    )}
                </div>

                {/* Skip Options Horizontal Scroll */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Available Skip Sizes</h2>
                        <div className="text-sm text-gray-500">
                            Scroll to see all options →
                        </div>
                    </div>

                    <div className="relative">
                        {/* Scroll container */}
                        <div className="flex overflow-x-auto pb-4 space-x-6 scrollbar-hide snap-x snap-mandatory">
                            {filteredSkips.map((skip) => (
                                <div
                                    key={skip.id}
                                    className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg cursor-pointer flex-shrink-0 w-80 snap-start ${selectedSkip === skip.id
                                        ? 'border-blue-600 ring-2 ring-blue-100'
                                        : 'border-gray-200 hover:border-gray-300'
                                        } ${skip.popular ? 'ring-2 ring-yellow-100' : ''}`}
                                    onClick={() => handleSkipSelect(skip.id)}
                                >
                                    {/* Popular Badge */}
                                    {skip.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                            <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    {/* Skip Image */}
                                    <div className="relative overflow-hidden rounded-t-xl">
                                        <img
                                            src={skip.image}
                                            alt={`${skip.sizeLabel} skip`}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 items-center justify-center hidden">
                                            <div className="text-center">
                                                <div className="w-20 h-12 bg-yellow-500 rounded-lg mx-auto mb-2 shadow-lg transform -rotate-12"></div>
                                                <div className="text-blue-900 font-bold text-sm">WE WANT WASTE</div>
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            {skip.sizeLabel}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {skip.sizeLabel} Skip
                                                </h3>
                                                <p className="text-sm text-gray-600">{skip.period}</p>
                                            </div>
                                            {renderPriceDetails(skip)}
                                        </div>

                                        {/* Capacity Information */}
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900 mb-1">Capacity</div>
                                                <div className="text-gray-600">≈ {skip.capacityInfo.binBags} bin bags</div>
                                                <div className="text-gray-500 text-xs mt-1">{skip.capacityInfo.description}</div>
                                            </div>
                                        </div>

                                        {/* Status Indicators */}
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {/* Hire Period Indicator */}
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {skip.hirePeriodDays} Day{skip.hirePeriodDays !== 1 ? 's' : ''}
                                            </span>

                                            {skip.roadLegal && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Road Legal
                                                </span>
                                            )}
                                            {skip.heavyWasteSuitable && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Heavy Waste OK
                                                </span>
                                            )}
                                            {!skip.roadLegal && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Not Road Legal
                                                </span>
                                            )}
                                            {!skip.heavyWasteSuitable && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    No Heavy Waste
                                                </span>
                                            )}
                                        </div>

                                        {/* Select Button */}
                                        <button
                                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${selectedSkip === skip.id
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                }`}
                                        >
                                            {selectedSkip === skip.id ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    Selected
                                                </>
                                            ) : (
                                                <>
                                                    Select This Skip
                                                    <ArrowRight className="w-5 h-5 ml-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scroll indicators (optional) */}
                        <div className="flex justify-center mt-4 space-x-2">
                            {filteredSkips.map((_, index) => (
                                <div
                                    key={index}
                                    className="w-2 h-2 rounded-full bg-gray-300"
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* No Results Message */}
                {filteredSkips.length === 0 && (
                    <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No skips match your filters</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your filter settings</p>
                        <button
                            onClick={() => {
                                setShowRoadLegalOnly(false);
                                setShowHeavyWasteOnly(false);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Continue Button */}
                {selectedSkip && (
                    <div className="flex justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 flex items-center shadow-lg">
                            Continue to Permit Check
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                )}
            </div>
            {/* Help Modal */}
            <HelpModal />
        </div>
    );
};

export default SkipHireSelector;