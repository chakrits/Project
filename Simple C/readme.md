> ### `exercise1.c` show the for-loop technique.
#### to print * in some shape as formula.
#### Example like this
```
    *     *
   **     **
  ***     ***
 ****     ****
*****     *****
```

#### in code you can see the systax in for-loop
``` C
for(i=1;i<=row;i++)
    {
        for(j=1;j<=row;j++)
        {
            if(j <= i)
                printf("*");
            else
                printf(" ");
        }
        printf("\n");
 ```
 
 #### this formula `j <= i ` can be change if you want to print difference shape.
 #### |1,1|1,2|1,3|1,4|1,5|
 #### |2,1|2,2|2,3|2,4|2,5|
 #### |3,1|3,2|3,3|3,4|3,5|
 #### |4,1|4,2|4,3|4,4|4,5|
 #### |5,1|5,2|5,3|5,4|5,5|
