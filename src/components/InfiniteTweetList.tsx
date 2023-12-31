import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import { useSession } from "next-auth/react";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { useRouter } from "next/router";

type Tweet = {
    id: string;
    content: string;
    createdAt: Date;
    likeCount: number;
    likedByMe: boolean;
    user: { id: string; image: string | null; name: string | null };
};

type InfiniteTweetListProps = {
    isLoading: boolean;
    isError: boolean;
    hasMore: boolean | undefined;
    fetchNewTweets: () => Promise<unknown>;
    tweets?: Tweet[];
};

export function InfiniteTweetList({
    tweets,
    isError,
    isLoading,
    hasMore = false,
    fetchNewTweets,

}: InfiniteTweetListProps) {

    if (isLoading) return <LoadingSpinner/>;
    if (isError) return <h1>Error...</h1>;

    if (tweets == null || tweets.length === 0) {
        return (
            <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
        );
    }

    return (
        <ul>
            <InfiniteScroll
                dataLength={tweets.length}
                next={fetchNewTweets}
                hasMore={hasMore}
                loader={<LoadingSpinner/>}
            >
                {tweets.map((tweet) => {
                    return <TweetCard key={tweet.id} {...tweet} />;
                })}
            </InfiniteScroll>

        </ul>
    )

}

function TweetCard({
    id,
    user,
    content,
    createdAt,
    likeCount,
    likedByMe
}: Tweet) {

    const router = useRouter()


    const trpcUtils = api.useUtils();

    const toggleLike = api.tweet.toggleLike.useMutation({
        onSuccess: ({ addedLike }) => {

            const updateData: Parameters<
                typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
            >[1] = (oldData) => {
                if (oldData == null) return;

                const countModifier = addedLike ? 1 : -1;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => {
                        return {
                            ...page,
                            tweets: page.tweets.map((tweet) => {
                                if (tweet.id === id) {
                                    return {
                                        ...tweet,
                                        likeCount: tweet.likeCount + countModifier,
                                        likedByMe: addedLike,
                                    };
                                    
                                }

                                return tweet;
                            }),
                        };
                    }),
                };
            };

            trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
            trpcUtils.tweet.infiniteFeed.setInfiniteData({ onlyFollowing: true}, updateData);
            trpcUtils.tweet.infiniteFeed.setInfiniteData({
                userId: user.id
            }, updateData);

        }

    })

    function handleToggleLike() {
        toggleLike.mutate({ id })
    }

    return (
        <li className="flex border-b gap-4 p-3">
            {router.asPath !== `/profiles/${user.id}` ? (
            <Link href={`/profiles/${user.id}`}>
                <ProfileImage src={user.image} />
            </Link>
            ) : (
                <ProfileImage src={user.image} />
            )}
            
            <div >
                <div>
                    {router.asPath !== `/profiles/${user.id}` ? (
                        <Link
                        href={`/profiles/${user.id}`}
                        className="font-bold hover:underline focus-visible:underline"
                    >
                        {user.name}
                    </Link>
                    ) : (
                        <span className="font-bold hover:underline focus-visible:underline">
                            {user.name}
                        </span>
                    )}                   

                </div>

                <p className="whitespace-pre-wrap">
                    {content}
                </p>
                <HeartButton
                    onClick={handleToggleLike}
                    isLoading={toggleLike.isLoading}
                    likedByMe={likedByMe}
                    likeCount={likeCount} />
            </div>
        </li>
    )
}

type HeartButtonProps = {
    onClick: () => void
    isLoading: boolean
    likedByMe: boolean
    likeCount: number
}

function HeartButton({
    onClick,
    isLoading,
    likedByMe,
    likeCount,
}: HeartButtonProps) {
    const session = useSession()
    const HeartIcon = likedByMe ? VscHeartFilled : VscHeart

    if (session.status !== "authenticated") {
        return <div className="my-1 flex items-center gap-2 self-start text-gray-500">
            <HeartIcon />
            <span>{likeCount}</span>
        </div>
    }

    return (
        <button
            disabled={isLoading}
            onClick={onClick}
            className={`my-1 group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${likedByMe
                ? "text-red-500"
                : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
                }`}
        >
            <IconHoverEffect red>
                <HeartIcon
                    className={`transition-colors duration-200 ${likedByMe
                        ? "fill-red-500"
                        : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
                        }`} />

            </IconHoverEffect>
            <span>{likeCount}</span>

        </button>
    )

}