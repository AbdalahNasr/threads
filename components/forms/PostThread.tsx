

"use client"
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { usePathname, useRouter } from 'next/navigation';
import { ThreadValidation } from '@/lib/validations/thread';
import { create } from 'domain';
import { createThread } from '@/lib/actions/thread.action';
import { useOrganization } from '@clerk/nextjs';

interface Props {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string; 
  }
  btnTitle: string
}





function PostThread({userId}:{userId  : string}) {
    const router = useRouter();
    const pathname = usePathname(); 
    const {organization} = useOrganization();  
      // Log the organization ID
  console.log("Organization ID:", organization ? organization.id : null);
    const form = useForm({
      resolver: zodResolver(ThreadValidation),
      defaultValues: {
    thread:'',
    accountId: userId ,
}
});
const onSubmit= async(values: z.infer<typeof ThreadValidation>) => {

  { 
    
    console.log('ORG :', {organization } )};

    await createThread({
      text: values.thread,
      author:userId,
      communityId: organization ? organization.id : null
      ,path:pathname
    });
    
   { console.log({organization})};
   { console.log('user Id :', userId)};
    
   { console.log('thread :', {createThread} )};
    router.push("/")
}
    return (
            <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className=" mt-10 flex flex-col  justify-start gap-10">
        
      <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className=' flex flex-col w-full gap-3'> 
              <FormLabel className='text-base-semibold text-light-2'>
                content 

              </FormLabel>
              <FormControl className=' no-focus border border-dark-4 bg-dark-3 text-light-1'
              >
                <Textarea 
                      rows={15}
                  {...field}
                />
              </FormControl>
                            <FormMessage/>

              <FormMessage />
            </FormItem>
          )}
        />
<Button type="submit" className='bg-primary-500'>post thread</Button>
        </form>   

      </Form>    



    )
    
}

export default PostThread;