import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, User, Calendar, Tag, Trash2, Pencil } from "lucide-react";

const PostCard = ({ post, onLike, onComment, currentUserId, onDelete, onEdit }) => {
	const [showComments, setShowComments] = useState(false);
	const [newComment, setNewComment] = useState("");
	const [submittingComment, setSubmittingComment] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [favicon, setFavicon] = useState(null);

	useEffect(() => {
		if (post.link) {
			fetchFavicon(post.link);
		}
	}, [post.link]);

	const fetchFavicon = async (url) => {
		try {
			const domain = new URL(url).hostname;
			const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

			const img = new Image();
			img.onload = () => setFavicon(faviconUrl);
			img.onerror = () => setFavicon(null);
			img.src = faviconUrl;
		} catch (error) {
			setFavicon(null);
		}
	};

	const handleComment = async () => {
		if (!newComment.trim()) return;
		setSubmittingComment(true);
		await onComment(post.id, newComment);
		setNewComment("");
		setSubmittingComment(false);
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const isLiked = post.likes?.includes(currentUserId);
	const isAuthor = post.author_id === currentUserId;

	// Strip HTML tags for length calculation
	const stripHtml = (html) => {
		const tmp = document.createElement("div");
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || "";
	};

	const plainContent = stripHtml(post.content);
	const hasMoreContent = plainContent.length > 150;

	// Simple truncation that preserves HTML structure
	const truncatedContent = hasMoreContent ? `<div>${post.content.substring(0, 150)}...</div>` : post.content;

	return (
		<div className="bg-white rounded-lg shadow-md p-6 mb-4">
			{/* Header */}
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					{post.author_profile_picture ? (
						<img
							src={post.author_profile_picture}
							alt={post.author_name || "User"}
							className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
							onError={(e) => {
								e.target.style.display = "none";
								e.target.nextSibling.style.display = "flex";
							}}
						/>
					) : null}
					<div className={`w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center ${post.author_profile_picture ? "hidden" : ""}`}>
						<User className="w-5 h-5 text-indigo-600" />
					</div>
					<div>
						<div className="font-semibold text-gray-900">{post.author_name || "Anonymous"}</div>
						<div className="text-sm text-gray-500 flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							{formatDate(post.created_at)}
						</div>
					</div>
				</div>
				{isAuthor && (
					<div className="flex gap-2">
						<button onClick={() => onEdit(post.id)} className="text-indigo-500 hover:text-indigo-700 text-sm flex items-center gap-1 transition-colors">
							<Pencil className="w-4 h-4" />
							Edit
						</button>
						<button onClick={() => onDelete(post.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 transition-colors">
							<Trash2 className="w-4 h-4" />
							Delete
						</button>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
				<div className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none">{isExpanded ? <div dangerouslySetInnerHTML={{ __html: post.content }} /> : <div dangerouslySetInnerHTML={{ __html: truncatedContent }} />}</div>
				{hasMoreContent && (
					<button onClick={() => setIsExpanded(!isExpanded)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2">
						{isExpanded ? "Show less" : "Show more"}
					</button>
				)}
			</div>

			{/* Image */}
			{post.image_url && (
				<div className="mb-4">
					<div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
						<img
							src={post.image_url}
							alt="Post image"
							className={`w-full rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer ${isExpanded ? "h-auto max-h-96 object-contain" : "h-72 object-cover"}`}
							onError={(e) => {
								console.error("Image failed to load:", post.image_url);
								e.target.style.display = "none";
							}}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								window.open(post.image_url, "_blank", "noopener,noreferrer");
							}}
						/>
						{!isExpanded && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none" />}
					</div>
				</div>
			)}

			{/* Tags */}
			{post.tags && post.tags.length > 0 && (
				<div className="mb-4">
					<div className="text-sm font-medium text-gray-700 mb-2">Tags:</div>
					<div className="flex flex-wrap gap-2">
						{(isExpanded ? post.tags : post.tags.slice(0, 3)).map((tag, index) => (
							<span key={index} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-blue-200">
								<Tag className="w-3 h-3" />
								{tag}
							</span>
						))}
						{!isExpanded && post.tags.length > 3 && <span className="text-gray-500 text-xs">+{post.tags.length - 3} more</span>}
					</div>
				</div>
			)}

			{/* Link */}
			{post.link && (
				<div className="mb-4">
					<div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
						<a href={post.link} target="_blank" rel="noopener noreferrer" className="block">
							<div className="p-4">
								<div className="flex items-start gap-3">
									{/* Favicon or Default Icon */}
									<div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
										{favicon ? (
											<img src={favicon} alt="Website icon" className="w-8 h-8 rounded" />
										) : (
											<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
											</svg>
										)}
									</div>

									{/* Link Content */}
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-gray-900 mb-1">{post.link_name || "External Link"}</div>
										<div className="text-xs text-gray-500 truncate">{post.link}</div>
										<div className="text-xs text-indigo-600 mt-1">Click to visit →</div>
									</div>
								</div>
							</div>
						</a>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex items-center gap-4 pt-4 border-t border-gray-200">
				<button onClick={() => onLike(post.id)} className={`flex items-center gap-2 text-sm transition-colors ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
					<Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
					{post.likes?.length || 0}
				</button>
				<button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
					<MessageCircle className="w-4 h-4" />
					{post.comments?.length || 0} Comments
				</button>
			</div>

			{/* Comments */}
			{showComments && (
				<div className="mt-4 pt-4 border-t border-gray-200">
					<div className="flex gap-2 mb-4">
						<input type="text" placeholder="Add a comment..." className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleComment()} />
						<button onClick={handleComment} disabled={submittingComment || !newComment.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
							{submittingComment ? "..." : "Post"}
						</button>
					</div>
					<div className="space-y-3">
						{post.comments?.map((comment, index) => (
							<div key={index} className="bg-gray-50 rounded-lg p-3">
								<div className="flex items-center gap-2 mb-1">
									{comment.author_profile_picture ? (
										<img
											src={comment.author_profile_picture}
											alt={comment.author_name || "User"}
											className="w-6 h-6 rounded-full object-cover border border-gray-200"
											onError={(e) => {
												e.target.style.display = "none";
												e.target.nextSibling.style.display = "flex";
											}}
										/>
									) : null}
									<div className={`w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center ${comment.author_profile_picture ? "hidden" : ""}`}>
										<User className="w-3 h-3 text-indigo-600" />
									</div>
									<span className="font-medium text-sm text-gray-900">{comment.author_name || "Anonymous"}</span>
									<span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
								</div>
								<p className="text-sm text-gray-700">{comment.content}</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default PostCard;
