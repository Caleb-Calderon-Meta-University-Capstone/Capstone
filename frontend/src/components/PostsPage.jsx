import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavigationBar from "./NavigationBar";
import LoadingSpinner from "./LoadingSpinner";
import Footer from "./Footer";
import NewPostModal from "./NewPostModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import PostCard from "./PostCard";
import { Plus, ChevronDown } from "lucide-react";

export default function PostsPage() {
	const navigate = useNavigate();
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [activeTab, setActiveTab] = useState("all");
	const [showNewPostModal, setShowNewPostModal] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [postToEdit, setPostToEdit] = useState(null);
	const [sortBy, setSortBy] = useState("date");
	const [sortDirection, setSortDirection] = useState("desc");
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const postsPerPage = 5;
	const [errorModal, setErrorModal] = useState({ show: false, message: "" });

	useEffect(() => {
		fetchUserAndPosts();
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showSortDropdown && !event.target.closest(".sort-dropdown")) {
				setShowSortDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showSortDropdown]);

	const fetchUserAndPosts = async () => {
		try {
			setLoading(true);
			setError(null);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				navigate("/login");
				return;
			}
			setCurrentUser(user);

			const { data: postsData, error: postsError } = await supabase
				.from("posts")
				.select(
					`
					*,
					users!posts_author_id_fkey(name, profile_picture),
					post_likes(user_id),
					post_comments(
						*,
						users!post_comments_author_id_fkey(name, profile_picture)
					)
				`
				)
				.order("created_at", { ascending: false });

			if (postsError) throw postsError;

			const processedPosts = postsData.map((post) => ({
				...post,
				author_name: post.users?.name || "Anonymous",
				author_profile_picture: post.users?.profile_picture,
				likes: post.post_likes?.map((like) => like.user_id) || [],
				comments:
					post.post_comments?.map((comment) => ({
						...comment,
						author_name: comment.users?.name || "Anonymous",
						author_profile_picture: comment.users?.profile_picture,
					})) || [],
			}));

			setPosts(processedPosts);
		} catch (err) {
			setError(err.message);
			console.error("Error fetching posts:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreatePost = async (formData) => {
		try {
			setSubmitting(true);

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const tags = formData.tags
				? formData.tags
						.split(/[,\s]+/)
						.map((tag) => tag.trim().replace(/^#+/, ""))
						.filter((tag) => tag.length > 0)
				: [];

			let imageUrl = null;
			if (formData.image) {
				const fileName = `${user.id}/${Date.now()}-${formData.image.name}`;
				try {
					const { data: uploadData, error: uploadError } = await supabase.storage.from("post-images").upload(fileName, formData.image, { upsert: false });

					if (uploadError) throw uploadError;

					const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(fileName);

					imageUrl = publicUrlData.publicUrl;
				} catch (err) {
					console.error("Image upload failed:", err.message);
				}
			} else if (formData.imageUrl && formData.imageUrl.trim()) {
				imageUrl = formData.imageUrl.trim();
			}

			if (editMode && postToEdit) {
				const { data, error } = await supabase
					.from("posts")
					.update({
						title: formData.title,
						content: formData.content,
						tags: tags,
						link: formData.link || null,
						link_name: formData.linkName || null,
						image_url: imageUrl,
					})
					.eq("id", postToEdit)
					.select()
					.single();

				if (error) throw error;
			} else {
				const { data, error } = await supabase
					.from("posts")
					.insert([
						{
							title: formData.title,
							content: formData.content,
							tags: tags,
							link: formData.link || null,
							link_name: formData.linkName || null,
							image_url: imageUrl,
							author_id: user.id,
						},
					])
					.select()
					.single();

				if (error) throw error;
			}

			await fetchUserAndPosts();
			setShowNewPostModal(false);
			setEditMode(false);
			setPostToEdit(null);
		} catch (err) {
			console.error("Error creating/updating post:", err);
			setErrorModal({ show: true, message: "Failed to save post. Please try again." });
		} finally {
			setSubmitting(false);
		}
	};

	const handleEditPost = (postId) => {
		const post = posts.find((p) => p.id === postId);
		if (post) {
			setPostToEdit(postId);
			setEditMode(true);
			setShowNewPostModal(true);
		}
	};

	const handleLike = async (postId) => {
		if (!currentUser) return;

		try {
			const existingLike = posts.find((post) => post.id === postId)?.likes?.includes(currentUser.id);

			if (existingLike) {
				await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUser.id);
			} else {
				await supabase.from("post_likes").insert([{ post_id: postId, user_id: currentUser.id }]);
			}

			await fetchUserAndPosts();
		} catch (err) {
			console.error("Error updating like:", err);
		}
	};

	const handleComment = async (postId, content) => {
		if (!currentUser || !content.trim()) return;

		try {
			await supabase.from("post_comments").insert([
				{
					post_id: postId,
					author_id: currentUser.id,
					content: content.trim(),
				},
			]);

			await fetchUserAndPosts();
		} catch (err) {
			console.error("Error adding comment:", err);
		}
	};

	const handleDeletePost = async (postId) => {
		setPostToDelete(postId);
		setShowDeleteConfirm(true);
	};

	const confirmDeletePost = async () => {
		if (!postToDelete) return;

		try {
			setDeleting(true);
			await supabase.from("posts").delete().eq("id", postToDelete);
			await supabase.from("post_likes").delete().eq("post_id", postToDelete);
			await supabase.from("post_comments").delete().eq("post_id", postToDelete);
			await fetchUserAndPosts();
			setShowDeleteConfirm(false);
			setPostToDelete(null);
		} catch (err) {
			console.error("Error deleting post:", err);
			setErrorModal({ show: true, message: "Failed to delete post. Please try again." });
		} finally {
			setDeleting(false);
		}
	};

	const sortPosts = (postsToSort) => {
		const sortedPosts = [...postsToSort];

		return sortedPosts.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "date":
					comparison = new Date(a.created_at) - new Date(b.created_at);
					break;
				case "likes":
					comparison = (a.likes?.length || 0) - (b.likes?.length || 0);
					break;
				case "comments":
					comparison = (a.comments?.length || 0) - (b.comments?.length || 0);
					break;
				default:
					return 0;
			}

			return sortDirection === "desc" ? -comparison : comparison;
		});
	};

	const filteredPosts = sortPosts(
		posts.filter((post) => {
			if (activeTab === "my") {
				return post.author_id === currentUser?.id;
			}
			return true;
		})
	);

	const indexOfLastPost = currentPage * postsPerPage;
	const indexOfFirstPost = indexOfLastPost - postsPerPage;
	const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
	const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

	useEffect(() => {
		setCurrentPage(1);
	}, [activeTab, sortBy, sortDirection]);

	if (loading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen">
				<NavigationBar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Posts</h2>
						<p className="text-white mb-4">{error}</p>
						<button onClick={fetchUserAndPosts} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white flex flex-col">
			<NavigationBar />

			<div className="flex-1 py-12 px-4">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<div className="flex items-center justify-center mb-4">
							<img src="/MICS_Colorstack_Logo_Light.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
							<h1 className="text-5xl font-black text-center text-white tracking-tight relative z-10">MICS Posts</h1>
						</div>
						<p className="text-white text-lg">Share updates, opportunities, and connect with fellow MICS members</p>
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
						<div className="flex items-center gap-4">
							<div className="flex bg-white/10 rounded-lg p-1">
								<button onClick={() => setActiveTab("all")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "all" ? "bg-white text-indigo-700" : "text-white hover:bg-white/20"}`}>
									All Posts
								</button>
								<button onClick={() => setActiveTab("my")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "my" ? "bg-white text-indigo-700" : "text-white hover:bg-white/20"}`}>
									My Posts
								</button>
							</div>

							<div className="relative sort-dropdown">
								<button onClick={() => setShowSortDropdown(!showSortDropdown)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
									{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} ({sortDirection === "desc" ? "Desc" : "Asc"})
									<ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
								</button>

								{showSortDropdown && (
									<div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
										<div className="py-1">
											{[
												{ value: "date", label: "Date" },
												{ value: "likes", label: "Likes" },
												{ value: "comments", label: "Comments" },
											].map((option) => (
												<div key={option.value}>
													<button
														onClick={() => {
															setSortBy(option.value);
															setSortDirection("desc");
															setShowSortDropdown(false);
														}}
														className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${sortBy === option.value && sortDirection === "desc" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}
													>
														{option.label} (Descending)
													</button>
													<button
														onClick={() => {
															setSortBy(option.value);
															setSortDirection("asc");
															setShowSortDropdown(false);
														}}
														className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${sortBy === option.value && sortDirection === "asc" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}
													>
														{option.label} (Ascending)
													</button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						<button
							onClick={() => {
								setEditMode(false);
								setPostToEdit(null);
								setShowNewPostModal(true);
							}}
							className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							New Post
						</button>
					</div>

					<div className="text-center mb-6">
						<p className="text-white/90 font-medium">
							Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, filteredPosts.length)} of {filteredPosts.length} posts
						</p>
					</div>

					<div className="space-y-4">
						{currentPosts.length === 0 ? (
							<div className="text-center py-12">
								<p className="text-white text-lg">{activeTab === "my" ? "You haven't created any posts yet." : "No posts yet. Be the first to share something!"}</p>
							</div>
						) : (
							currentPosts.map((post) => <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} currentUserId={currentUser?.id} onDelete={handleDeletePost} onEdit={handleEditPost} />)
						)}
					</div>

					{totalPages > 1 && (
						<div className="flex justify-center items-center gap-2 mt-8 mb-4">
							<button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300">
								Previous
							</button>

							<div className="flex gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
									const shouldShow = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;

									if (shouldShow) {
										return (
											<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-2 rounded-lg font-medium transition-colors ${pageNum === currentPage ? "bg-indigo-600 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}>
												{pageNum}
											</button>
										);
									} else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
										return (
											<span key={pageNum} className="px-2 py-2 text-white/60">
												...
											</span>
										);
									}
									return null;
								})}
							</div>

							<button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300">
								Next
							</button>
						</div>
					)}
				</div>
			</div>

			<NewPostModal
				visible={showNewPostModal}
				onClose={() => {
					setShowNewPostModal(false);
					setEditMode(false);
					setPostToEdit(null);
				}}
				onSubmit={handleCreatePost}
				submitting={submitting}
				editMode={editMode}
				initialData={editMode ? posts.find((p) => p.id === postToEdit) : null}
			/>
			<DeleteConfirmModal visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDeletePost} postTitle={posts.find((p) => p.id === postToDelete)?.title} deleting={deleting} />


			{errorModal.show && (
				<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-sm mx-4">
						<div className="flex items-center mb-4">
							<div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
								<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
								</svg>
							</div>
							<div className="ml-3">
								<h3 className="text-lg font-medium text-gray-900">Error</h3>
							</div>
						</div>
						<div className="mb-6">
							<p className="text-sm text-gray-700">{errorModal.message}</p>
						</div>
						<div className="flex justify-end">
							<button onClick={() => setErrorModal({ show: false, message: "" })} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
								OK
							</button>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
}
