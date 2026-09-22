import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const WishlistContext = createContext();

export const WishlistProvider = ({ children, user, allProducts = [], addToCart, showToast }) => {
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mj_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.map(item => (typeof item === 'object' && item !== null ? String(item.id) : String(item)))
          : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const userId = user?.uid || user?.id || user?.phone || null;

  // Sync with Firestore when user logs in or mounts
  useEffect(() => {
    let isMounted = true;

    const syncUserWishlist = async () => {
      if (!userId) return;

      try {
        const wishlistRef = collection(db, 'users', String(userId), 'wishlist');
        const snapshot = await getDocs(wishlistRef);
        const remoteIds = snapshot.docs.map(d => String(d.id));

        if (!isMounted) return;

        // Merge local storage items into Firestore
        const mergedSet = new Set([...wishlistIds, ...remoteIds]);
        const mergedArray = Array.from(mergedSet);

        // Upload any local items missing in remote
        const newLocalItems = wishlistIds.filter(id => !remoteIds.includes(id));
        for (const prodId of newLocalItems) {
          try {
            await setDoc(doc(db, 'users', String(userId), 'wishlist', String(prodId)), {
              productId: String(prodId),
              addedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.error('Failed to sync local wishlist item to Firestore:', e);
          }
        }

        setWishlistIds(mergedArray);
        localStorage.setItem('mj_wishlist', JSON.stringify(mergedArray));
      } catch (err) {
        console.error('Error syncing wishlist with Firestore:', err);
      }
    };

    syncUserWishlist();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mj_wishlist', JSON.stringify(wishlistIds));
    } catch (err) {
      console.error('Error saving wishlist to localStorage:', err);
    }
  }, [wishlistIds]);

  // Toggle wishlist
  const toggleWishlist = useCallback(async (productOrId) => {
    const rawId = typeof productOrId === 'object' && productOrId !== null ? productOrId.id : productOrId;
    if (!rawId) return;
    const targetId = String(rawId);

    setWishlistIds(prev => {
      const exists = prev.includes(targetId);
      let updated;
      if (exists) {
        updated = prev.filter(id => id !== targetId);
        if (showToast) showToast('Removed from Wishlist');
      } else {
        updated = [...prev, targetId];
        if (showToast) showToast('Added to Wishlist!');
      }

      // Firestore sync if logged in
      if (userId) {
        const itemRef = doc(db, 'users', String(userId), 'wishlist', targetId);
        if (exists) {
          deleteDoc(itemRef).catch(e => console.error('Error deleting from Firestore wishlist:', e));
        } else {
          setDoc(itemRef, {
            productId: targetId,
            addedAt: new Date().toISOString()
          }, { merge: true }).catch(e => console.error('Error adding to Firestore wishlist:', e));
        }
      }

      return updated;
    });
  }, [userId, showToast]);

  const isInWishlist = useCallback((productId) => {
    if (!productId) return false;
    return wishlistIds.includes(String(productId));
  }, [wishlistIds]);

  // Full wishlist product objects
  const wishlistProducts = wishlistIds.map(id => {
    return allProducts.find(p => String(p.id) === String(id)) || { id, title: `RC Machine #${id}`, price: 0 };
  }).filter(Boolean);

  const moveToCart = useCallback((product) => {
    if (addToCart) {
      addToCart(product);
    }
    toggleWishlist(product.id || product);
    if (showToast) showToast('Moved to Cart!');
  }, [addToCart, toggleWishlist, showToast]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlist: wishlistProducts,
        wishlistCount: wishlistIds.length,
        toggleWishlist,
        isInWishlist,
        moveToCart
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
