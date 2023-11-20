import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from 'next/error'
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { Button } from "~/components/Button";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { useSession } from "next-auth/react";


const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ id }) => {

  const { data: profile } = api.profile.getById.useQuery({ id })

  const tweets = api.tweet.infiniteFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({addedFollow}) => {

    }
  })

  if (profile == null) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <Head>
        <title>
          {`Twitter Clone - ${profile.name}`}
        </title>
      </Head>
      <header className="flex gap-x-3 items-center px-4 py-2 sticky top-0 z-10 border-b bg-white pt-2">
        <Link href='..'>
          <IconHoverEffect>
            <VscArrowLeft href=".." className="h-5 w-5" />
          </IconHoverEffect>

        </Link>

        <ProfileImage src={profile.image} className="h-8 w-8" />
        <div className="flex-grow">
          <h1 className="font-bold text-lg">{profile.name}</h1>
          <div className=" text-sm text-gray-500">
            {profile.tweetsCount}{" "}
            {getPlural(profile.tweetsCount, "Tweet", "Tweets")} -{" "}
            {profile.followersCount}{" "}
            {getPlural(profile.followersCount, "Follower", "Followers")} -{" "}
            {profile.followsCount} Following
          </div>
        </div>
        <FollowButton 
        userId={id}
        isFollowing={profile.isFollowing}
        onClick={() => toggleFollow.mutate({userId: id})} 
        />

      </header>
      <main>
        <InfiniteTweetList
          tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
          isError={tweets.isError}
          isLoading={tweets.isLoading}
          hasMore={tweets.hasNextPage}
          fetchNewTweets={tweets.fetchNextPage}
        />
      </main>

    </>
  )
}

function FollowButton({
  userId,
  isFollowing,
  onClick,
}: {
  userId: string
  isFollowing: boolean
  onClick: () => void
}) {
  const session = useSession()

  if(session.status !== "authenticated" || session.data.user.id === userId){
    return null
  }


  return (
   <Button small gray={isFollowing} onClick={onClick} >
    {isFollowing ? "Unfollow" : "Follow"}
  </Button>
  )

}

const pluralRules = new Intl.PluralRules();
function getPlural(number: number, singular: string, plural: string) {
  return pluralRules.select(number) === "one" ? singular : plural
}


export const getStaticPaths: GetStaticPaths = () => {

  return {
    paths: [],
    fallback: "blocking",
  };
};



export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>,
) {

  const id = context.params?.id

  if (id == null) {
    return {
      redirect: {
        destination: "/",
      }
    }
  }

  const ssg = ssgHelper()
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}

export default ProfilePage