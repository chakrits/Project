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

    //while-loop example 
    //Control in vertical
    i=0; 
    while(i<=row)
    {
        j=0;
        //Control in horizontal
        while(j<=row)
        {
            //formula for print * in any shape
            if(j+i == row+1 || j==i)
                printf("*");
            else
                printf(" ");
            j++;
        }
        printf("\n");
        i++;
    }
    
    return 0;
    
}