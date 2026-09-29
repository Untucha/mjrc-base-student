import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Star, Upload, CheckCircle2, ShieldCheck, Sparkles, MessageSquare, ArrowLeft, Video, Image as ImageIcon, X, Package } from 'lucide-react';

export const SubmitReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addReview, user, showToast } = useStore();

  const urlOrderId = searchParams.get('orderId') || searchParams.get('order') || '';
  const urlPhone = searchParams.get('phone') || searchParams.get('mobile') || user?.phone || '';
  const urlName = searchParams.get('customer') || searchParams.get('name') || searchParams.get('customerName') || user?.name || '';

  const [orderId, setOrderId] = useState(urlOrderId);
  const [customerName, setCustomerName] = useState(urlName);
  const [customerPhone, setCustomerPhone] = useState(urlPhone);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customProductWish, setCustomProductWish] = useState('');

  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    let currentPhotos = mediaFiles.filter(f => f.type.startsWith('image/'));
    let currentVideos = mediaFiles.filter(f => f.type.startsWith('video/'));

    for (const file of selectedFiles) {
      if (file.type.startsWith('image/')) {
        if (currentPhotos.length >= 1) {
          const msg = 'Maximum 1 photo allowed per review.';
          if (showToast) showToast(msg);
          else alert(msg);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          const msg = 'Photo size must be under 5MB.';
          if (showToast) showToast(msg);
          else alert(msg);
          continue;
        }
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
          const msg = 'Photo must be JPG, PNG, or WEBP format.';
          if (showToast) showToast(msg);
          else alert(msg);
          continue;
        }
        currentPhotos.push(file);
      } else if (file.type.startsWith('video/')) {
        if (currentVideos.length >= 1) {
          const msg = 'Maximum 1 video clip allowed per review.';
          if (showToast) showToast(msg);
          else alert(msg);
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          const msg = 'Video must be under 20 seconds and 20MB';
          if (showToast) showToast(msg);
          else alert(msg);
          continue;
        }
        const duration = await getVideoDuration(file);
        if (duration > 20) {
          const msg = 'Video must be under 20 seconds and 20MB';
          if (showToast) showToast(msg);
          else alert(msg);
          continue;
        }
        currentVideos.push(file);
      }
    }

    const updatedFiles = [...currentPhotos, ...currentVideos];
    setMediaFiles(updatedFiles);

    const previews = updatedFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
      file
    }));
    setMediaPreviews(previews);
  };

  const removeMedia = (index) => {
    const updatedFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(updatedFiles);
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMediaToStorage = async (file, targetOrderId) => {
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `reviews_media/${targetOrderId || 'general'}/${fileId}`;

    try {
      if (storage) {
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
      }
    } catch (err) {
      console.warn('[Firebase Storage] Upload notice, converting to data URL fallback:', err);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please enter your review feedback.');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter your name.');
      return;
    }

    setIsUploading(true);
    const targetOrderId = orderId.trim() || `order-${Date.now()}`;

    try {
      const uploadedUrls = [];
      for (const file of mediaFiles) {
        const url = await uploadMediaToStorage(file, targetOrderId);
        if (url) uploadedUrls.push(url);
      }

      await addReview({
        orderId: targetOrderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        mediaUrls: uploadedUrls,
        customProductWish: customProductWish.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setIsUploading(false);
      setIsSubmitted(true);
      if (showToast) showToast('Review submitted for moderation!');
    } catch (err) {
      console.error('Submit review error:', err);
      setIsUploading(false);
      alert('Review submission failed. Please try again.');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-[80vh] font-sans text-slate-900">
      
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>← Back to Storefront</span>
        </button>

        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200/60 px-3 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Customer Feedback
        </span>
      </div>

      {isSubmitted ? (
        /* Thank You Celebration Card */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" /> Moderation Pending
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Review Submitted Successfully!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-lg mx-auto leading-relaxed">
              Thank you for sharing your experience! Your review is pending admin inspection and will appear on the storefront once approved.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              Return to Storefront
            </button>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setComment('');
                setCustomProductWish('');
                setMediaFiles([]);
                setMediaPreviews([]);
              }}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-6 py-3.5 rounded-xl transition cursor-pointer"
            >
              Submit Another Review
            </button>
          </div>
        </div>
      ) : (
        /* Public Review Submission Form */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Card Title */}
          <div className="pb-4 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Customer Unboxing & Performance Review
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Share Your RC Experience
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Share your speed, trail, and unboxing experience to help fellow RC drivers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium">
            
            {/* Step 1: Star Rating Selector */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center space-y-2">
              <label className="block text-slate-800 font-black text-xs uppercase tracking-wider">
                Overall Satisfaction Rating *
              </label>
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(rating)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-500 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-xs font-black text-amber-700">
                {rating === 5 && '⭐⭐⭐⭐⭐ Exceptional (5 / 5)'}
                {rating === 4 && '⭐⭐⭐⭐ Great Experience (4 / 5)'}
                {rating === 3 && '⭐⭐⭐ Average (3 / 5)'}
                {rating <= 2 && '⭐⭐ Fair / Needs Improvement'}
              </div>
            </div>

            {/* Customer Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1 uppercase tracking-wider text-[10px]">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1 uppercase tracking-wider text-[10px]">
                  WhatsApp Mobile No. (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1 uppercase tracking-wider text-[10px]">
                  Order No. / Reference (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. MJ-88421"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <Package className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Step 2: Review Comment Textarea */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 uppercase tracking-wider text-[10px]">
                Review Comment *
              </label>
              <textarea
                rows="4"
                required
                placeholder="Share your speed, trail, and unboxing experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 focus:outline-none focus:border-emerald-500 font-sans text-xs font-medium leading-relaxed"
              />
            </div>

            {/* Step 3: File Uploader with Strict Media Constraints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-800 font-extrabold uppercase tracking-wider text-[10px]">
                  Attach Unboxing Photos & Action Reel Videos (Optional)
                </label>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Max 1 Photo (5MB) | Max 1 Video (20s / 20MB)
                </span>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 transition cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                  id="review-media-input"
                />
                <label htmlFor="review-media-input" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-xs">Click to select photo or video</span>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      1 Photo (JPG/PNG/WEBP, max 5MB) & 1 Video (max 20s, max 20MB)
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded File Previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {mediaPreviews.map((item, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1 right-1 bg-slate-900/80 text-white p-1 rounded-full hover:bg-rose-600 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-1 left-1 bg-slate-900/80 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1">
                        {item.type === 'video' ? <Video className="w-2.5 h-2.5 text-rose-400" /> : <ImageIcon className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Future Demand / Upsell Input Field */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-2">
              <label className="block text-amber-950 font-black text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Custom RC Parts & Wishlist Demand</span>
              </label>
              <p className="text-[11px] text-amber-800 font-medium">
                Looking for any specific custom RC model, upgrade, or spare parts not in our store?
              </p>
              <input
                type="text"
                placeholder="e.g. Metal portal axles for MN99S, 3S 5000mAh Lipo battery, etc."
                value={customProductWish}
                onChange={(e) => setCustomProductWish(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-xl p-3 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-sm py-4 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading Media & Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubmitReview;
