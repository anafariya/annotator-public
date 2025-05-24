'use client'
import { useState, useEffect } from "react";
import { getJobPosts } from "@/app/actions/job";
import MapComponent from "../JobMap";
import { Search, X } from "lucide-react";

interface JobPost {
    _id: string;
    title: string;
    content: string;
    lat: string;
    lng: string;
    compensation: string;
    location: string;
    category?: string;
    label:string[]
}

interface MarkerData {
    id: string;
    coordinates: [number, number];
}

const categories = [
    'LLM BENCHMARK',
    'TRANSLATION',
    'MULTIMODALITY',
    'ACCENTS',
    'ENGLISH'
];

export default function InteractiveMap() {
    const [posts, setPosts] = useState<JobPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await getJobPosts({ limit: 200 });
                const parsedResponse = JSON.parse(response);

                if (!parsedResponse.success || !parsedResponse.data) {
                    setError("Failed to load job posts");
                } else {
                    setPosts(parsedResponse.data.posts);
                    setFilteredPosts(parsedResponse.data.posts);
                    
                    // Calculate new center after posts are loaded
                    const jobCounts = parsedResponse.data.posts.reduce(
                        (acc: Record<string, number>, post: JobPost) => {
                            const key = `${post.lat},${post.lng}`;
                            acc[key] = (acc[key] || 0) + 1;
                            return acc;
                        },
                        {}
                    );

                    const maxLocation = Object.entries(jobCounts).reduce(
                        (max, [coords, count]) => {
                            return count > max.count ? { coords, count } : max;
                        },
                        { coords: "", count: 0 }
                    );

                    if (maxLocation.coords) {
                        const [lat, lng] = maxLocation.coords.split(",").map(Number);
                        setMapCenter([lat, lng]);
                    }
                }
            } catch (err) {
                console.log(err)
                setError("Failed to load job posts");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    useEffect(() => {
        filterPosts();
    }, [searchValue, activeCategory, posts]);

const filterPosts = () => {
  console.log("--------- FILTERING STARTED ---------");
  console.log("Active Category:", activeCategory);
  console.log("Search Mode:", isSearchMode);
  console.log("Search Value:", searchValue);
  console.log("Total Posts Before Filtering:", posts.length);
  
  // Log a few examples to see what we're working with
  if (posts.length > 0) {
    console.log("Sample Post Label:", posts[0].label);
    console.log("Sample Post Type:", Array.isArray(posts[0].label) ? "Array" : typeof posts[0].label);
  }
  
  let filtered = [...posts];
  
  // Filter by category if activeCategory is set
  if (activeCategory) {
    console.log("Filtering by category:", activeCategory);
    
    filtered = filtered.filter((post) => {
      // Ensure label is treated as an array (it should already be one)
      const labels = Array.isArray(post.label) ? post.label : [];
      
      // Log some debugging info for a few posts
      if (posts.indexOf(post) < 3) {
        console.log(`Post ${post._id} Labels:`, labels);
      }
      
      // Simple string comparison - no need for complex parsing
      const match = labels.some(label => 
        label.toLowerCase() === activeCategory.toLowerCase()
      );
      
      // Log the match result for a few posts
      if (posts.indexOf(post) < 3) {
        console.log(`Post ${post._id} matches ${activeCategory}:`, match);
      }
      
      return match;
    });
    
    console.log("Posts after category filtering:", filtered.length);
  }
  
  // Filter by search term if in search mode
  if (isSearchMode && searchValue) {
    console.log("Filtering by search term:", searchValue);
    
    const searchLower = searchValue.toLowerCase();
    filtered = filtered.filter(
      (post) => {
        const matchesTitle = post.title.toLowerCase().includes(searchLower);
        const matchesLocation = post.location.toLowerCase().includes(searchLower);
        
        // Log the match result for a few posts
        if (posts.indexOf(post) < 3) {
          console.log(`Post ${post._id} matches search "${searchValue}":`, matchesTitle || matchesLocation);
        }
        
        return matchesTitle || matchesLocation;
      }
    );
    
    console.log("Posts after search filtering:", filtered.length);
  }
  
  console.log("Final filtered posts count:", filtered.length);
  console.log("--------- FILTERING ENDED ---------");
  
  setFilteredPosts(filtered);
};

    const handleCategoryClick = (category: string) => {
        if (activeCategory === category) {
            setActiveCategory('');
        } else {
            setActiveCategory(category);
        }
    };

    const handleSearchToggle = () => {
        setIsSearchMode(!isSearchMode);
        if (isSearchMode) {
            setSearchValue('');
        }
    };

    if (error) return <div className="text-center text-red-600">{error}</div>;
    
    const markers: MarkerData[] = filteredPosts
        .map(post => {
            const lat = parseFloat(post.lat);
            const lng = parseFloat(post.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                return { id: post._id, coordinates: [lat, lng] };
            }
            return null;
        })
        .filter((marker): marker is MarkerData => marker !== null);

    return (
        <div className="w-full mt-24 ">
      <div className="container mx-auto px-4">
                {/* Search Bar */}
        <div className="mb-8 w-full max-w-3xl mx-auto">
          <div
            className={`
            relative flex items-center rounded-full border border-gray-200 
            transition-all duration-300 ease-in-out overflow-hidden
            ${isSearchMode ? "bg-white shadow-lg" : "bg-transparent"}
          `}
          >
            <div
              className={`
              flex-1 flex items-center gap-2 px-4 h-12
              transition-all duration-300 ease-in-out
              ${isSearchMode ? "w-full" : "w-auto"}
            `}
            >
              {!isSearchMode ? (
                categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`
                      px-4 py-1 rounded-full text-sm font-medium 
                      transition-all duration-200 whitespace-nowrap
                      ${
                        activeCategory === category
                          ? "bg-black text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }
                    `}
                  >
                    {category}
                  </button>
                ))
              ) : (
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full bg-transparent outline-none text-gray-700"
                  autoFocus
                />
              )}
            </div>

            <button
              onClick={handleSearchToggle}
              className={`
                p-3 rounded-full transition-all duration-200
                ${isSearchMode ? "hover:bg-gray-100" : "bg-[#ff395c] text-white hover:bg-gray-700"}
              `}
            >
              {isSearchMode ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>
        </div>
            </div>

            <div className="w-full flex-1">
                <MapComponent 
                    posts={filteredPosts} 
                    markers={markers} 
                    center={mapCenter}
                />
            </div>
        </div>
    );
}