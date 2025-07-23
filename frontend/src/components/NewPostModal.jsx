import React, { useState, useEffect } from "react";
import { Bold, Italic, Underline } from "lucide-react";

const NewPostModal = ({ visible, onClose, onSubmit, submitting, editMode = false, initialData = null }) => {
	const [formData, setFormData] = useState({
		title: "",
		content: "",
		tags: "",
		link: "",
		linkName: "",
		image: null,
		imageUrl: "",
	});
	const [imagePreview, setImagePreview] = useState(null);
	const [contentRef, setContentRef] = useState(null);

	useEffect(() => {
		if (editMode && initialData) {
			setFormData({
				title: initialData.title || "",
				content: initialData.content || "",
				tags: initialData.tags ? initialData.tags.join(", ") : "",
				link: initialData.link || "",
				linkName: initialData.link_name || "",
				image: null,
				imageUrl: initialData.image_url || "",
			});
			setImagePreview(initialData.image_url || null);
		} else {
			setFormData({ title: "", content: "", tags: "", link: "", linkName: "", image: null, imageUrl: "" });
			setImagePreview(null);
		}
	}, [editMode, initialData, visible]);

	useEffect(() => {
		if (contentRef && formData.content !== contentRef.innerHTML) {
			contentRef.innerHTML = formData.content;
		}
	}, [formData.content, contentRef]);

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setFormData({ ...formData, image: file, imageUrl: "" });
			const reader = new FileReader();
			reader.onload = (e) => setImagePreview(e.target.result);
			reader.readAsDataURL(file);
		}
	};

	const handleImageUrlChange = (e) => {
		const url = e.target.value;
		setFormData({ ...formData, imageUrl: url, image: null });
		setImagePreview(url || null);
	};

	const removeImage = () => {
		setFormData({ ...formData, image: null, imageUrl: "" });
		setImagePreview(null);
	};

	const handleContentChange = (e) => {
		setFormData({ ...formData, content: e.target.innerHTML });
	};

	const formatText = (command, value = null) => {
		contentRef?.focus();
		document.execCommand(command, false, value);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(formData);
		if (!editMode) {
			setFormData({ title: "", content: "", tags: "", link: "", linkName: "", image: null, imageUrl: "" });
			setImagePreview(null);
		}
	};

	if (!visible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
			<div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-900">{editMode ? "Edit Post" : "Create New Post"}</h2>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
							×
						</button>
					</div>
				</div>

				<div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
					<form onSubmit={handleSubmit} className="space-y-4">
						<input type="text" required placeholder="Enter post title..." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />

						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Content *</label>

							<div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
								<button type="button" onClick={() => formatText("bold")} className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700" title="Bold (Ctrl+B)">
									<Bold className="w-4 h-4" />
								</button>
								<button type="button" onClick={() => formatText("italic")} className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700" title="Italic (Ctrl+I)">
									<Italic className="w-4 h-4" />
								</button>
								<button type="button" onClick={() => formatText("underline")} className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700" title="Underline (Ctrl+U)">
									<Underline className="w-4 h-4" />
								</button>
							</div>

							<div ref={setContentRef} contentEditable className="w-full min-h-[200px] bg-white border border-gray-300 rounded-b-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" onInput={handleContentChange} placeholder="Share your thoughts, opportunities, or updates... (Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline)" />
						</div>

						<input type="text" placeholder="e.g., #internships #events #shoutouts" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<input type="text" placeholder="e.g., Job Application Link" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" value={formData.linkName} onChange={(e) => setFormData({ ...formData, linkName: e.target.value })} />
							<input type="url" placeholder="https://..." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
						</div>

						<div className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<input type="file" accept="image/*" onChange={handleImageChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
								<input type="url" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={handleImageUrlChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
							</div>
							{imagePreview && (
								<div className="relative">
									<img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
									<button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600">
										×
									</button>
								</div>
							)}
						</div>
					</form>
				</div>

				<div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
					<div className="flex justify-end gap-3">
						<button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
							Cancel
						</button>
						<button onClick={handleSubmit} disabled={submitting || !formData.title || !formData.content} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
							{submitting ? (editMode ? "Updating..." : "Creating...") : editMode ? "Update Post" : "Create Post"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NewPostModal;
