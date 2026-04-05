#include <stdio.h>
#include <stdlib.h>


int main (void){
    //Exercise for coding For-loop technique

    int i, j, row, col;

    puts("This code for practicing");


    printf("\nPlease put the number of row : ");
    scanf("%d",&row);
    printf("Row = %d\n",row);
    col = (2 * row) -1;
    printf("Col (2 * Row) -1 = %d\n",col);
    printf("This exercise for loop with row * col\n");

    //For-loop example  
    //Control in vertical 
    for(i=1;i<=row;i++)
    {
        //Control in horizontal
        for(j=1;j<=col;j++)
        {
            //formula for print * in any shape
            if(j+i >= row+1 && j-i <= row -1)
                printf("*");
            else
                printf(" ");
        }
        printf("\n");
    }
    
    return 0;
    
}