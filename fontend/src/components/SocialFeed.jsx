import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import CreatePostBox from './CreatePostBox';
import { API_URL } from '../config/api';

const SocialFeed = ({ onOpenChat, onOpenStore }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <section className="max-w-[700px] mx-auto px-4 py-8 pb-20">
      <CreatePostBox onPostSuccess={(newPost) => {
        if (newPost) {
          setPosts(prev => [newPost, ...prev]);
        } else {
          fetchPosts(); // fallback
        }
      }} />

      <div className="flex flex-col gap-y-2">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onMessage={onOpenChat} onOpenStore={onOpenStore} />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-100 border-dashed">
            Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
          </div>
        )}
      </div>

      {/* Footer báo hiệu hết bài viết */}
      {!loading && posts.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-sm animate-in fade-in duration-500">
          <p className="flex items-center justify-center gap-2">
            <span className="w-8 h-[1px] bg-gray-200"></span>
            Bạn đã xem hết bài viết mới nhất hôm nay 🍃
            <span className="w-8 h-[1px] bg-gray-200"></span>
          </p>
        </div>
      )}
    </section>
  );
};

export default SocialFeed;
