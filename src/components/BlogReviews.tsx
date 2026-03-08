import type { BlogPost } from '../hooks/useBlogSearch'

interface BlogReviewsProps {
  posts: BlogPost[]
  isLoading: boolean
  error: string | null
  placeName: string
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
  }
  return dateStr
}

export default function BlogReviews({ posts, isLoading, error, placeName }: BlogReviewsProps) {
  if (isLoading) {
    return (
      <div className="blog-reviews">
        <h4 className="blog-reviews-title">블로그 리뷰</h4>
        <p className="blog-reviews-status">리뷰를 검색하는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="blog-reviews">
        <h4 className="blog-reviews-title">블로그 리뷰</h4>
        <p className="blog-reviews-status error">{error}</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="blog-reviews">
        <h4 className="blog-reviews-title">블로그 리뷰</h4>
        <p className="blog-reviews-status">"{placeName}" 관련 블로그 리뷰가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="blog-reviews">
      <h4 className="blog-reviews-title">블로그 리뷰</h4>
      <div className="blog-reviews-list">
        {posts.map((post, i) => (
          <a
            key={i}
            className="blog-review-item"
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="blog-review-header">
              <span className="blog-review-author">{post.bloggername}</span>
              <span className="blog-review-date">{formatDate(post.postdate)}</span>
            </div>
            <h5 className="blog-review-title">{post.title}</h5>
            <p className="blog-review-desc">{post.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
