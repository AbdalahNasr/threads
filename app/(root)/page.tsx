

import { ClerkProvider, UserButton } from '@clerk/nextjs'
import '../globals.css'
import { fetchPosts } from '@/lib/actions/thread.action';
import ThreadCard from '@/components/cards/ThreadCard';
import { currentUser } from '@clerk/nextjs/server';
export default async function Home() {


     const user = await currentUser();
     if (!user) return null;
     const result = await fetchPosts(1, 30);

     
     
     
     return (
     <>
       <h1 className="head-text  text-left">Threads</h1>
<section className="mt-9 flex flex-col gap-10">
     {result.posts.length === 0 ?( 
          <p className="no-result">No Threads</p>
     ):(
          
          
          <>
{result.posts.map((post)=>( 
     
     <ThreadCard
     
     key={post._id}
id={post._id}
currentUserId={user.id || ""}
parentId={post._id}
content={post.text}
author={post.author}
community={post.community}
createdAt={post.createdAt}
comments={post.children}


/> 

))}
</>

     )}

</section>


     </>
 )
}