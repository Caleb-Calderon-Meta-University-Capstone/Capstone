import React from "react";

export default function AdvancedFiltersModal({ visible, onClose, filters, onFiltersChange, sortBy, sortOrder, onSortChange, onApply, onReset }) {
	if (!visible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-semibold text-gray-900">Advanced Filters & Sorting</h3>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
							×
						</button>
					</div>
				</div>

				<div className="p-6 space-y-6">
					<div>
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-lg font-semibold text-gray-800">Filters</h4>
							<button onClick={onReset} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
								Clear All
							</button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
								<div className="space-y-2">
									<div>
										<label className="block text-xs text-gray-500 mb-1">Start Date</label>
										<input type="date" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.dateRange.start || ""} onChange={(e) => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })} />
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">End Date</label>
										<input type="date" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.dateRange.end || ""} onChange={(e) => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })} />
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Points Range</label>
								<div className="space-y-2">
									<div>
										<label className="block text-xs text-gray-500 mb-1">Minimum Points</label>
										<input type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.pointsRange.min || ""} onChange={(e) => onFiltersChange({ ...filters, pointsRange: { ...filters.pointsRange, min: e.target.value ? parseInt(e.target.value) : null } })} />
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">Maximum Points</label>
										<input type="number" placeholder="100" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.pointsRange.max || ""} onChange={(e) => onFiltersChange({ ...filters, pointsRange: { ...filters.pointsRange, max: e.target.value ? parseInt(e.target.value) : null } })} />
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
								<input type="text" placeholder="Filter by location..." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.location} onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })} />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Creator</label>
								<input type="text" placeholder="Filter by creator..." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.creator} onChange={(e) => onFiltersChange({ ...filters, creator: e.target.value })} />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Registration Status</label>
								<select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.registrationStatus} onChange={(e) => onFiltersChange({ ...filters, registrationStatus: e.target.value })}>
									<option value="all">All Events</option>
									<option value="registered">Registered Only</option>
									<option value="not-registered">Not Registered</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
								<select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.eventType} onChange={(e) => onFiltersChange({ ...filters, eventType: e.target.value })}>
									<option value="all">All Types</option>
									<option value="workshop">Workshop</option>
									<option value="networking">Networking</option>
									<option value="seminar">Seminar</option>
									<option value="hackathon">Hackathon</option>
									<option value="conference">Conference</option>
								</select>
							</div>
						</div>
					</div>

					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-4">Sorting</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Sort By */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
								<select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={sortBy} onChange={(e) => onSortChange({ sortBy: e.target.value, sortOrder })}>
									<option value="date">Date</option>
									<option value="title">Title</option>
									<option value="points">Points</option>
									<option value="creator">Creator</option>
									<option value="location">Location</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
								<select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" value={sortOrder} onChange={(e) => onSortChange({ sortBy, sortOrder: e.target.value })}>
									<option value="asc">Ascending</option>
									<option value="desc">Descending</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				<div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
					<div className="flex justify-end gap-3">
						<button onClick={onClose} className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
							Cancel
						</button>
						<button onClick={onApply} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
							Apply Filters
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
