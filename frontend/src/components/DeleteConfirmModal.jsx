import React from "react";
import { Trash2 } from "lucide-react";

const DeleteConfirmModal = ({ visible, onClose, onConfirm, postTitle, deleting }) => {
	if (!visible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
			<div className="bg-white rounded-xl shadow-lg w-full max-w-md">
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
							<Trash2 className="w-5 h-5 text-red-600" />
						</div>
						<h2 className="text-xl font-semibold text-gray-900">Delete Post</h2>
					</div>
				</div>
				<div className="px-6 py-4">
					<p className="text-gray-700 mb-2">Are you sure you want to delete this post?</p>
					<p className="text-sm text-gray-500 font-medium">"{postTitle}"</p>
					<p className="text-xs text-gray-400 mt-2">This action cannot be undone.</p>
				</div>
				<div className="px-6 py-4 border-t border-gray-200">
					<div className="flex justify-end gap-3">
						<button onClick={onClose} disabled={deleting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
							Cancel
						</button>
						<button onClick={onConfirm} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
							{deleting ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="w-4 h-4" />
									Delete Post
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DeleteConfirmModal;
