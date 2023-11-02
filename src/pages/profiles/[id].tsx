import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from 'next/error'
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { Button } from "~/components/Button";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";


const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ id }) => {

  const { data: profile } = api.profile.getById.useQuery({ id })

  const tweets = api.tweet.infiniteFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

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
        <VscArrowLeft href=".." className="h-5 w-5" />
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
        <Button small className="">
          Follow
        </Button>

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