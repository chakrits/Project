#include <stdio.h>
#include <stdlib.h>


int main (void){
    //Exercise for coding For-loop technique

    int i, j , row;

    puts("This code for practicing");


    printf("\nPlease put the number of row : ");
    scanf("%d",&row);

    //
    printf("Row is = %d \n",row);

    //For-loop example 
    //Control in vertical 
    for(i=1;i<=row;i++)
    {
        //Control in horizontal
        for(j=1;j<=row;j++)
        {
            //formula for print * in any shape
            if(j+i == row+1)
                printf("*");
            else
                printf(" ");
        }
        printf("\n");
    }
    
    return 0;
    
}